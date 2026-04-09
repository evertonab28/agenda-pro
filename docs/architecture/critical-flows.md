# Agenda Pro: Critical Flow Review

This document maps the end-to-end flows for the most critical paths in the system, identifying involved services and observed risks.

## 1. Lifecycle: Trial to Paid (First Conversion)
**Purpose**: Capturing the first revenue from a new workspace.

- **Entry**: User selects a plan during or after trial.
- **Path**:
    1. `BillingController@activate` calls `WorkspaceBillingService@createInvoice`.
    2. `WorkspaceBillingService` ensures Asaas customer exists -> creates `WorkspaceBillingInvoice` -> creates Asaas charge.
    3. User pays via external link.
    4. `SaasBillingWebhookController` receives payment notification -> calls `WorkspaceBillingService@confirmPayment`.
    5. `confirmPayment` updates invoice status -> creates `WorkspaceSubscription` (status: active) -> emits `subscription_activated` event.
- **Risks**: 
    - Dependency on external `PaymentLink` visibility.
    - If the webhook fails, the workspace remains `trialing` until manual reconciliation.

## 2. Lifecycle: Plan Upgrade
**Purpose**: Growing account value (Expansion).

- **Entry**: User requests an upgrade via Settings.
- **Path**:
    1. `BillingController@upgrade` calls `WorkspaceBillingService@createInvoice` with type `upgrade`.
    2. New invoice generated for the higher amount.
    3. Payment confirmation triggers `WorkspaceBillingService@confirmPayment`.
    4. Subscription is updated to the new `plan_id`.
    5. `plan_upgraded` event emitted.
- **Risks**:
    - No pro-rata logic implemented (users might pay full price for both plans if upgrade happens mid-month).
    - Downgrade path is not explicitly documented or handled.

## 3. Lifecycle: Dunning & Overdue Recovery
**Purpose**: Minimizing involuntary churn.

- **Trigger**: Webhook notification from Asaas (payment overdue) or Scheduler check.
- **Path**:
    1. `SaasBillingWebhookController` receives `PAYMENT_OVERDUE`.
    2. System updates `WorkspaceBillingInvoice` to `overdue`.
    3. `SubscriptionService` (in dunning flow) updates `WorkspaceSubscription` status to `overdue`.
    4. Middleware `subscribed` blocks access to operational features.
    5. On payment: `confirmPayment` sets status back to `active` -> emits `subscription_reactivated`.
- **Risks**:
    - "Silencioso" Churn: If a workspace is overdue but no invoice exists for the next period, they might stay in an undefined state.

## 4. Operational Flow: Appointment to Charge (Checkout)
**Purpose**: Ensuring the workspace gets paid by its clients.

- **Entry**: `AgendaController@finalizeAndCheckout`.
- **Path**:
    1. Appointment status -> `completed`.
    2. `FinanceService` calculates amount (service price - discounts).
    3. `Charge` created for the `Customer`.
    4. If automated: `IntegrationProviderFactory` triggers payment link generation.
- **Risks**:
    - Inconsistency if Appointment is completed but Charge creation fails (transactional boundary check needed).

## 5. Webhook Consumption: SaaS Billing (Asaas)
**Purpose**: Syncing with the Source of Truth for revenue.

- **Entry**: `POST /api/webhooks/saas-billing/asaas`
- **Path**:
    1. `SaasBillingWebhookController` validates provider token.
    2. Identifies workspace via `invoice_id` or `external_reference`.
    3. Updates `WorkspaceBillingInvoice`.
    4. Triggers relevant `WorkspaceBillingService` methods.
- **Risks**:
    - Idempotency: Duplicate webhooks might trigger duplicate `subscription_renewed` events if not guarded.
    - Security: Needs robust signature verification.

---
*Last updated: 2026-04-09*
