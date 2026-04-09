# Agenda Pro: Domain Map

This document maps the Bounded Contexts of the Agenda Pro SaaS, identifying responsibilities, core entities, and service layers.

## 1. Workspace & Tenancy
The foundation of the multi-tenant architecture. Ensures data isolation and workspace identification.

- **Primary Responsibility**: Manage workspace identifiers, subdomains/slugs, and lifecycle.
- **Central Entities**: `Workspace`, `User`.
- **Primary Services**: `OnboardingService` (implicit flow).
- **Events**: `workspace_created`.
- **Dependencies**: All other domains depend on this via `TenantScope`.
- **Risks**: Accidental leaks if `withoutGlobalScopes()` is used incorrectly in application code.

## 2. Scheduling Core
The functional heart of the operational platform. Manages time, resource availability, and commitments.

- **Primary Responsibility**: Handle appointment booking, professional schedules, holidays, and conflict detection.
- **Central Entities**: `Appointment`, `Professional`, `ProfessionalSchedule`, `Service`, `Holiday`.
- **Primary Services**: `AgendaService`.
- **Events**: `appointment_created`, `appointment_rescheduled`, `appointment_canceled`.
- **Dependencies**: Workspace.
- **Risks**: Performance bottlenecks during complex conflict checks; SQL isolation in buffer calculations (MySQL vs SQLite).

## 3. Customers & CRM
Manages the relationship between the workspace and its end-users/patients.

- **Primary Responsibility**: Profile management, behavioral segmentation, and re-engagement triggers.
- **Central Entities**: `Customer`, `CRMAction`, `WaitlistEntry`.
- **Primary Services**: `CRMService`.
- **Events**: `customer_created`, `segment_changed` (implicit).
- **Dependencies**: Workspace, Scheduling.
- **Risks**: Segment calculation is currently O(N) in some services; needs migration to event-driven updates.

## 4. Operational Finance
Manages the workspace's revenue stream from its clients.

- **Primary Responsibility**: Issuing charges for services/packages, recording receipts, and managing professional commissions (indirectly).
- **Central Entities**: `Charge`, `Receipt`, `CustomerPackage`, `Wallet`, `WalletTransaction`.
- **Primary Services**: `FinanceService`, `PackageService`, `WalletService`.
- **Events**: `charge_generated`, `payment_received`.
- **Dependencies**: Workspace, Customers, Scheduling.
- **Risks**: High coupling with `Scheduling` (checkout flow); risk of state inconsistency between `Appointment` and `Charge`.

## 5. Workspace Integrations
Connects the operational platform to external communication and billing providers.

- **Primary Responsibility**: Abstracting providers (WhatsApp, SMS, Email) and handling inbound webhooks for operational alerts.
- **Central Entities**: `WorkspaceIntegration`.
- **Primary Services**: `IntegrationProviderFactory`, `MessagingServiceInterface`.
- **Events**: `notification_sent`, `webhook_received`.
- **Dependencies**: Workspace.
- **Risks**: Vendor lock-in; failure of one provider impacting workspace-to-client communication.

## 6. SaaS Billing & Subscriptions
The revenue engine of Agenda Pro. Manages plans, SaaS invoices, and subscription state.

- **Primary Responsibility**: Subscription lifecycle, plan management, SaaS-level revenue collection.
- **Central Entities**: `Plan`, `WorkspaceSubscription`, `WorkspaceBillingInvoice`.
- **Primary Services**: `WorkspaceBillingService`, `SubscriptionService`.
- **Events**: `subscription_activated`, `plan_upgraded`, `invoice_paid`.
- **Dependencies**: Workspace.
- **Risks**: Domain leak between Workspace Billing (SaaS) and Operational Billing (Workspace Clients); confusion in nomenclature.

## 7. Revenue Ops & Retention
Analytical layer for monitoring SaaS health and executing proactive commercial actions.

- **Primary Responsibility**: Monitoring churn, trial conversion, dunning/collection, and revenue movement.
- **Central Entities**: `WorkspaceSubscriptionEvent`.
- **Primary Services**: `SaasMetricsService`, `RevenueOpsService`, `DunningService`, `TrialConversionService`.
- **Events**: `subscription_canceled`, `cancellation_reason_recorded`.
- **Dependencies**: Workspace, SaaS Billing.
- **Risks**: High dependency on `withoutGlobalScopes()`; potential for slow dashboard performance as workspace count grows.

## 8. Control Plane (SaaS Admin)
Centralized administration for the platform owners.

- **Primary Responsibility**: Platform monitoring, user support, manual workspace adjustments, and global plan management.
- **Central Entities**: `AdminUser`.
- **Primary Services**: `SaasMetricsService` (consumer).
- **Events**: N/A (mostly an orchestration layer).
- **Dependencies**: All domains (via `withoutGlobalScopes`).
- **Risks**: Escalation of privilege; performance issues when querying across all tenants.

---
*Last updated: 2026-04-09*
