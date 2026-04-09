# Agenda Pro: Architecture Recommendations

This document outlines the strategic roadmap for evolving the Agenda Pro architecture, focusing on modularity, scalability, and observability.

## 1. Phase: NOW (Immediate Technical Fixes)
*Focus: Stabilizing existing flows and removing performance bottlenecks.*

- **Standardize Event Logging**: Wrap the creation of `WorkspaceSubscriptionEvent` into a dedicated `RevenueLogService` or a `Logging` trait to avoid string literal duplication across `WorkspaceBillingService` and `Admin` controllers.
- **Fix CRM Performance**: Implement a `CustomerSegmentUpdated` event or a nightly job to pre-calculate segments. Stop iterating over all customers for the "Ativo/Novo/VIP" count in the dashboard.
- **Harden Webhooks**: Add signature validation for Asaas webhooks and implement a "Webhook Log" table to audit raw incoming payloads before processing.
- **Refactor Agenda Buffers**: Moving the `buffer_minutes` logic out of raw SQL into a Scope or a dedicated calculation class to ensure consistency between development (SQLite) and production (MySQL).

## 2. Phase: NEXT (Structural Improvements)
*Focus: Decoupling domains and improving developer productivity.*

- **Transition to Laravel Events/Listeners**: Replace model observers and inline logging with formal Events (e.g., `App\Events\SaaS\SubscriptionActivated`). Use Sync/Async listeners to handle commercial logging, notifications, and analytics updates separately.
- **Decouple Control Plane**: Create a `PlatformAdmin` namespace for services that explicitly ignore tenancy. Move metric calculations from `SaasMetricsService` to a Read-API pattern, reducing the risk of `withoutGlobalScopes` leaks in the UI controllers.
- **Service Provider Refactoring**: Split `AppServiceProvider` into logical providers (Billing, CRM, Messaging) to reduce the initialization cost and improve code discoverability.
- **Typed Payloads**: Introduce Data Transfer Objects (DTOs) for event payloads and service communication to eliminate "array-driven development" risks.

## 3. Phase: LATER (Strategic Evolution)
*Focus: Scaling for thousands of workspaces and complex integrations.*

- **Progressive Modularization**: Begin grouping services, models, and events into "Modules" (e.g., `Modules/Billing`, `Modules/Agenda`). Consider moving towards a "Modular Monolith" structure before even considering Microservices.
- **Dedicated Analytics Store**: As the `WorkspaceSubscriptionEvent` table grows, move its history to a dedicated analytical database (e.g., ClickHouse or a Read Replica) to keep the primary DB lean and the Revenue Ops dashboard fast.
- **External Integration Registry**: Formalize the Integration module by allowing workspaces to register multiple communication providers with per-event routing (e.g., WhatsApp for alerts, Email for invoices).
- **Public API Foundation**: Stabilize the `App\Http\Controllers\Api` layer to support third-party integrations, using the same domain services used by the internal UI.

---
*Last updated: 2026-04-09*
