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
    public function createInvoice(Workspace $workspace, Plan $plan, string $type = 'upgrade'): WorkspaceBillingInvoice
    {
        return DB::transaction(function () use ($workspace, $plan, $type) {
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
                'reference_period' => now()->format('m/Y'),
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
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $subscription = $invoice->workspace->subscriptions()->first();
            
            if (!$subscription) {
                // Create new subscription if not exists
                WorkspaceSubscription::create([
                    'workspace_id' => $invoice->workspace_id,
                    'plan_id' => $invoice->plan_id,
                    'status' => 'active',
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(), // Assuming monthly billing
                ]);
            } else {
                // Update existing subscription
                $subscription->update([
                    'plan_id' => $invoice->plan_id,
                    'status' => 'active',
                    // Adjust dates based on current status (e.g. extending if already active)
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(),
                ]);
            }

            Log::info("WorkspaceBillingService: Assinatura do workspace {$invoice->workspace_id} ativada via fatura {$invoice->id}.");

            return true;
        });
    }
}
