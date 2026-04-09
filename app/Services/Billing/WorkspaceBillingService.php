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
            $invoice->update([
                'status'  => 'paid',
                'paid_at' => now(),
            ]);

            // Use the subscription explicitly linked to this invoice.
            // If the invoice has no subscription_id yet (brand new customer),
            // fall back to the oldest workspace subscription.
            $subscription = $invoice->subscription_id
                ? $invoice->subscription
                : $invoice->workspace->subscriptions()->oldest()->first();
            $plan         = $invoice->plan;

            // Calculate next ends_at based on plan cycle
            $endsAt = now();
            if ($plan->billing_cycle === 'yearly') {
                $endsAt = $endsAt->addYear();
            } else {
                $endsAt = $endsAt->addMonth();
            }

            if (!$subscription) {
                // First payment ever — create subscription
                $subscription = WorkspaceSubscription::create([
                    'workspace_id' => $invoice->workspace_id,
                    'plan_id'      => $invoice->plan_id,
                    'status'       => 'active',
                    'starts_at'    => now(),
                    'ends_at'      => $endsAt,
                ]);

                $subscription->events()->create([
                    'workspace_id' => $invoice->workspace_id,
                    'event_type'   => 'subscription_activated',
                    'payload'      => [
                        'invoice_id'      => $invoice->id,
                        'amount'          => (float) $plan->price,
                        'previous_status' => 'none',
                        'new_ends_at'     => $endsAt->toDateTimeString(),
                        'plan_slug'       => $plan->slug,
                    ],
                ]);
            } else {
                $oldStatus    = $subscription->status;
                $oldPlanId    = $subscription->plan_id;
                $isFromTrial  = $oldStatus === 'trialing';
                $isPlanChange = $isFromTrial && (int) $oldPlanId !== (int) $invoice->plan_id;

                $subscription->update([
                    'plan_id'       => $invoice->plan_id,
                    'status'        => 'active',
                    'starts_at'     => now(),
                    'ends_at'       => $endsAt,
                    'trial_ends_at' => $isFromTrial ? null : $subscription->trial_ends_at,
                ]);

                $eventType = match (true) {
                    $oldStatus === 'overdue' => 'subscription_reactivated',
                    $isFromTrial             => 'subscription_activated',
                    default                  => 'subscription_renewed',
                };

                // Primary commercial event
                $subscription->events()->create([
                    'workspace_id' => $invoice->workspace_id,
                    'event_type'   => $eventType,
                    'payload'      => [
                        'invoice_id'      => $invoice->id,
                        'amount'          => (float) $plan->price,
                        'previous_status' => $oldStatus,
                        'new_ends_at'     => $endsAt->toDateTimeString(),
                        'plan_slug'       => $plan->slug,
                    ],
                ]);

                // Secondary: expansion_mrr event when upgrading during trial
                if ($isPlanChange) {
                    $subscription->events()->create([
                        'workspace_id' => $invoice->workspace_id,
                        'event_type'   => 'plan_upgraded',
                        'payload'      => [
                            'invoice_id' => $invoice->id,
                            'amount'     => (float) $plan->price,
                            'mrr_delta'  => (float) $plan->price,
                            'from_plan'  => $oldPlanId,
                            'to_plan'    => $invoice->plan_id,
                            'plan_slug'  => $plan->slug,
                        ],
                    ]);
                }
            }

            Log::info("WorkspaceBillingService: workspace {$invoice->workspace_id} subscription processed ({$subscription->status}).");

            return true;
        });
    }
}
