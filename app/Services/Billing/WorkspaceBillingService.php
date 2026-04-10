<?php

namespace App\Services\Billing;

use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Events\SaaS\InvoiceGenerated;
use App\Events\SaaS\SubscriptionActivated;
use App\Events\SaaS\SubscriptionRenewed;
use App\Events\SaaS\SubscriptionReactivated;
use App\Events\SaaS\PlanUpgraded;
use App\Events\SaaS\InvoicePaid;
use App\Events\SaaS\InvoiceOverdue;
use App\DTOs\SaaS\BillingWorkspaceDTO;
use App\DTOs\SaaS\CommercialEventPayload;

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
            $asaasCustomerId = $this->provider->getOrCreateCustomer(new BillingWorkspaceDTO(
                id: $workspace->id,
                name: $workspace->name,
                slug: $workspace->slug,
                email: $workspace->users()->first()?->email ?? 'admin@' . $workspace->slug . '.com'
            ));

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
                'provider_invoice_id' => $asaasPayment->id,
                'provider_payment_link' => $asaasPayment->invoiceUrl,
            ]);

            // 5. Log Event
            if ($subscription) {
                event(new InvoiceGenerated(new CommercialEventPayload(
                    workspaceId: $workspace->id,
                    subscriptionId: $subscription->id,
                    invoiceId: $invoice->id,
                    planId: $plan->id,
                    amount: (float) $invoice->amount,
                    meta: [
                        'type' => $type,
                        'payment_link' => $invoice->provider_payment_link
                    ]
                )));
            }

            return $invoice;
        });
    }

    /**
     * Confirm payment and activate/update subscription.
     */
    public function confirmPayment(WorkspaceBillingInvoice $invoice): bool
    {
        return DB::transaction(function () use ($invoice) {
            // Lock the invoice to prevent race conditions from duplicate webhooks
            $invoice = WorkspaceBillingInvoice::where('id', $invoice->id)->lockForUpdate()->first();

            if ($invoice->status === 'paid') {
                return true;
            }

            $invoice->update([
                'status'  => 'paid',
                'paid_at' => now(),
            ]);

            $subscription = $invoice->subscription_id
                ? $invoice->subscription
                : $invoice->workspace->subscriptions()->oldest()->first();
            
            $plan = $invoice->plan;
            $endsAt = $this->calculateNextEndsAt($plan);

            if (!$subscription) {
                $this->processNewSubscription($invoice, $plan, $endsAt);
            } else {
                $this->processExistingSubscription($invoice, $subscription, $plan, $endsAt);
            }

            Log::info("WorkspaceBillingService: workspace {$invoice->workspace_id} payment confirmed for invoice {$invoice->id}.");

            DB::afterCommit(fn() => event(new InvoicePaid(new CommercialEventPayload(
                workspaceId: $invoice->workspace_id,
                subscriptionId: $subscription?->id,
                invoiceId: $invoice->id,
                planId: $invoice->plan_id,
                amount: (float) $invoice->amount,
                meta: [
                    'paid_at'   => $invoice->paid_at->toDateTimeString(),
                    'plan_slug' => $plan->slug,
                ]
            ))));

            return true;
        });
    }

    /**
     * Mark an invoice and its subscription as overdue.
     */
    public function handleOverdue(WorkspaceBillingInvoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice = WorkspaceBillingInvoice::where('id', $invoice->id)->lockForUpdate()->first();
            
            if ($invoice->status === 'paid') {
                return;
            }

            $invoice->update(['status' => 'overdue']);
            
            if ($subscription = $invoice->subscription) {
                $subscription->update(['status' => 'overdue']);
            }
            
            DB::afterCommit(fn() => event(new InvoiceOverdue(new CommercialEventPayload(
                workspaceId: $invoice->workspace_id,
                subscriptionId: $invoice->subscription_id,
                invoiceId: $invoice->id,
                planId: $invoice->plan_id,
                amount: (float) $invoice->amount,
                meta: ['due_date' => $invoice->due_date?->toDateString()]
            ))));
        });
    }

    /**
     * Mark an invoice as canceled.
     */
    public function handleCancellation(WorkspaceBillingInvoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice = WorkspaceBillingInvoice::where('id', $invoice->id)->lockForUpdate()->first();
            
            if ($invoice->status === 'paid') {
                return;
            }

            $invoice->update(['status' => 'canceled']);
            Log::info("WorkspaceBillingService: invoice {$invoice->id} marked as canceled.");
        });
    }

    protected function calculateNextEndsAt(Plan $plan): \Carbon\Carbon
    {
        $endsAt = now();
        return $plan->billing_cycle === 'yearly' ? $endsAt->addYear() : $endsAt->addMonth();
    }

    protected function processNewSubscription(WorkspaceBillingInvoice $invoice, Plan $plan, $endsAt): void
    {
        $subscription = WorkspaceSubscription::create([
            'workspace_id' => $invoice->workspace_id,
            'plan_id'      => $invoice->plan_id,
            'status'       => 'active',
            'starts_at'    => now(),
            'ends_at'      => $endsAt,
        ]);

        DB::afterCommit(fn() => event(new SubscriptionActivated(new CommercialEventPayload(
            workspaceId: $invoice->workspace_id,
            subscriptionId: $subscription->id,
            invoiceId: $invoice->id,
            planId: $plan->id,
            amount: (float) $plan->price,
            meta: [
                'previous_status' => 'none',
                'new_ends_at'     => $endsAt->toDateTimeString(),
                'plan_slug'       => $plan->slug,
            ]
        ))));
    }

    protected function processExistingSubscription(WorkspaceBillingInvoice $invoice, WorkspaceSubscription $subscription, Plan $plan, $endsAt): void
    {
        $oldStatus    = $subscription->status;
        $oldPlanId    = $subscription->plan_id;
        $isFromTrial  = $oldStatus === 'trialing';
        $isPlanChange = (int) $oldPlanId !== (int) $invoice->plan_id;

        $subscription->update([
            'plan_id'       => $invoice->plan_id,
            'status'        => 'active',
            'starts_at'     => now(),
            'ends_at'       => $endsAt,
            'trial_ends_at' => $isFromTrial ? null : $subscription->trial_ends_at,
        ]);

        // Primary commercial event
        $eventClass = match (true) {
            $oldStatus === 'overdue' => SubscriptionReactivated::class,
            $isFromTrial             => SubscriptionActivated::class,
            default                  => SubscriptionRenewed::class,
        };

        DB::afterCommit(fn() => event(new $eventClass(new CommercialEventPayload(
            workspaceId: $invoice->workspace_id,
            subscriptionId: $subscription->id,
            invoiceId: $invoice->id,
            planId: $invoice->plan_id,
            amount: (float) $plan->price,
            meta: [
                'previous_status' => $oldStatus,
                'new_ends_at'     => $endsAt->toDateTimeString(),
                'plan_slug'       => $plan->slug,
            ]
        ))));

        // Secondary: expansion_mrr event when upgrading
        if ($isPlanChange) {
            DB::afterCommit(fn() => event(new PlanUpgraded(new CommercialEventPayload(
                workspaceId: $invoice->workspace_id,
                subscriptionId: $subscription->id,
                invoiceId: $invoice->id,
                planId: (int) $invoice->plan_id,
                previousPlanId: (int) $oldPlanId,
                amount: (float) $plan->price,
                deltaAmount: (float) $plan->price,
                meta: [
                    'mrr_delta'  => (float) $plan->price,
                    'plan_slug'  => $plan->slug,
                ]
            ))));
        }
    }
}
