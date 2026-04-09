<?php

namespace App\Services\Billing;

use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WorkspaceBillingService
{
    public function __construct(
        protected AsaasSaasProvider $provider
    ) {}

    /**
     * Generate an invoice for an upgrade or renewal.
     */
    public function createInvoice(Workspace $workspace, Plan $plan, string $type = 'upgrade', ?string $referencePeriod = null): WorkspaceBillingInvoice
    {
        return DB::transaction(function () use ($workspace, $plan, $type, $referencePeriod) {
            $subscription = $workspace->subscription;
            
            // 1. Ensure Customer exists in Asaas
            $asaasCustomerId = $this->provider->getOrCreateCustomer([
                'id' => $workspace->id,
                'name' => $workspace->name,
                'slug' => $workspace->slug,
                'email' => $workspace->users()->first()?->email ?? 'admin@' . $workspace->slug . '.com',
            ]);

            // 2. Local Invoice record
            $invoice = WorkspaceBillingInvoice::create([
                'workspace_id' => $workspace->id,
                'subscription_id' => $subscription?->id,
                'plan_id' => $plan->id,
                'amount' => $plan->price,
                'status' => 'pending',
                'due_date' => now()->addDays(3), // Default 3 days to pay
                'reference_period' => $referencePeriod ?? now()->format('m/Y'),
                'meta' => ['type' => $type],
            ]);

            // 3. Create charge in Asaas
            $description = "Assinatura Agenda Pro - Plano {$plan->name} ({$type})";
            $asaasPayment = $this->provider->createPayment(
                $asaasCustomerId,
                (float) $plan->price,
                $invoice->due_date->format('Y-m-d'),
                $description,
                (string) $invoice->id
            );

            // 4. Update local invoice with provider data
            $invoice->update([
                'provider_invoice_id' => $asaasPayment['id'],
                'provider_payment_link' => $asaasPayment['invoiceUrl'],
            ]);

            // 5. Log Event
            if ($subscription) {
                $subscription->events()->create([
                    'workspace_id' => $workspace->id,
                    'event_type' => 'invoice_generated',
                    'payload' => [
                        'invoice_id' => $invoice->id,
                        'amount' => $invoice->amount,
                        'type' => $type
                    ]
                ]);
            }

            return $invoice;
        });
    }

    /**
     * Confirm payment and activate/update subscription.
     */
    public function confirmPayment(WorkspaceBillingInvoice $invoice): bool
    {
        if ($invoice->status === 'paid') {
            return true;
        }

        return DB::transaction(function () use ($invoice) {
            $oldStatus = 'none';
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $subscription = $invoice->workspace->subscriptions()->first();
            $plan = $invoice->plan;
            
            // Calculate next ends_at based on plan cycle
            $endsAt = now();
            if ($plan->billing_cycle === 'yearly') {
                $endsAt = $endsAt->addYear();
            } else {
                $endsAt = $endsAt->addMonth();
            }

            if (!$subscription) {
                $subscription = WorkspaceSubscription::create([
                    'workspace_id' => $invoice->workspace_id,
                    'plan_id' => $invoice->plan_id,
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => $endsAt,
                ]);
                $eventType = 'subscription_activated';
            } else {
                $oldStatus = $subscription->status;
                $subscription->update([
                    'plan_id' => $invoice->plan_id,
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => $endsAt,
                ]);
                $eventType = ($oldStatus === 'overdue') ? 'subscription_reactivated' : 'subscription_renewed';
            }

            // Log Commercial Event
            $subscription->events()->create([
                'workspace_id' => $invoice->workspace_id,
                'event_type' => $eventType,
                'payload' => [
                    'invoice_id'      => $invoice->id,
                    'amount'          => (float) $plan->price,
                    'previous_status' => $oldStatus,
                    'new_ends_at'     => $endsAt->toDateTimeString(),
                    'plan_slug'       => $plan->slug,
                ]
            ]);

            Log::info("WorkspaceBillingService: Assinatura do workspace {$invoice->workspace_id} processada ({$eventType}).");

            return true;
        });
    }
}
