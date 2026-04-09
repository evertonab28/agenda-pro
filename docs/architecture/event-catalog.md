# Agenda Pro: Event Catalog

This document lists the domain events identified in the system, including persisted audit logs, implicit operational events, and identified gaps.

## 1. Persisted Domain Events (Commercial)
These events are stored in the `workspace_subscription_events` table and drive the Revenue Ops dashboard.

| Event Name | Owner Context | Payload Key Examples | Description |
|---|---|---|---|
| `subscription_activated` | SaaS Billing | `invoice_id`, `amount`, `plan_slug` | Emitted when the first payment (or trial conversion) is confirmed. |
| `subscription_renewed` | SaaS Billing | `invoice_id`, `amount`, `new_ends_at` | Emitted on recurring payment success. |
| `subscription_reactivated` | SaaS Billing | `previous_status`, `invoice_id` | Emitted when an `overdue` workspace pays its pending invoice. |
| `plan_upgraded` | SaaS Billing | `from_plan`, `to_plan`, `mrr_delta` | Emitted when a workspace switches to a higher-tier plan. |
| `invoice_generated` | SaaS Billing | `amount`, `due_date`, `type` | Audit trail for SaaS invoice creation. |
| `subscription_canceled` | Retention | `amount`, `canceled_by`, `category` | Emitted when a subscription is marked as canceled. |
| `cancellation_reason_recorded`| Retention | `category`, `reason` | Emitted when an admin or user provides feedback on churn. |

## 2. Implicit Operational Events
These events occur in the system but do not currently have a dedicated "Event" record, existing only as side effects in the database.

| Event Name | Type | Location | Side Effect |
|---|---|---|---|
| `appointment_booked` | Operational | `AgendaController@store` | Creates `Appointment` record. |
| `appointment_finalized` | Operational | `AgendaController@finalize` | Updates status and creates `Charge`. |
| `payment_received` | Financial | `FinanceService@receivePayment` | Creates `Receipt`, updates `Charge` status. |
| `charge_overdue` | Financial | `ChargeObserver` (implicit) | Model state transition. |
| `customer_created` | CRM | `CustomerController@store` | Creates `Customer` record. |
| `waitlist_called` | CRM | `CRMService@triggerAppointmentCanceled` | Updates `WaitlistEntry` status and sends message. |

## 3. Missing Events (Identified Gaps)
Recommended events that should be explicitly implemented to improve observability and automation.

| Recommended Event | Context | Why? |
|---|---|---|
| `trial_started` | SaaS Billing | To trigger "Day 1" onboarding email sequences. |
| `trial_expiring` | Retention | To trigger "3 days left" alerts (currently computed on-the-fly). |
| `trial_expired` | SaaS Billing | To restrict access immediately after 14 days without payment. |
| `mrr_movement` | Revenue Ops | A consolidated event for Expansion, Contraction, and Churn to simplify BI queries. |
| `integration_failed` | Integrations | To alert admins when a WhatsApp/Provider token becomes invalid. |
| `auth_failure_repeated`| Security | To detect brute-force attempts on portal logins. |

## Naming & Payload Standards (Proposed)
To avoid the current "sem padrão" (lack of pattern) risk:
1. **Naming**: Use `snake_case` in the past tense (e.g., `invoice_paid`, not `pay_invoice`).
2. **Context**: Prefix internal events with context (e.g., `billing.invoice_paid`).
3. **Payload**: Always include `timestamp`, `actor_id`, and `workspace_id` in the JSON payload, even if they are in the table columns, for easier export to analytical tools.

---
*Last updated: 2026-04-09*
