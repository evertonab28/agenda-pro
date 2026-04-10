# Schema Map — Agenda Pro

**Sprint T2 · Data: 2026-04-09**
**Estado real do banco após todas as 57 migrations aplicadas**

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                        WORKSPACES                           │
│           (âncora de toda a multi-tenancy)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ workspace_id
       ┌───────────────┼────────────────────┐
       │               │                    │
  SCHEDULING      CUSTOMERS & CRM     SAAS BILLING
  OPERATIONAL     FINANCIAL OPS       INTEGRATIONS
  FINANCE
```

---

## Domínio 1 — Workspace & Tenancy

### `workspaces` (ex-`clinics`)
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| name | varchar | Nome da clínica/negócio |
| slug | varchar UNIQUE | Identificador de URL |
| status | enum(active, inactive) | |
| created_at, updated_at | timestamps | |

### `users`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | nullable, cascade |
| name | varchar | |
| email | varchar UNIQUE | |
| password | varchar | hashed |
| role | varchar | operator, admin |
| status | varchar | |
| email_verified_at | timestamp | nullable |
| remember_token | varchar | nullable |
| created_at, updated_at | timestamps | |

### `admin_users`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| name | varchar | |
| email | varchar UNIQUE | |
| password | varchar | hashed |
| remember_token | varchar | nullable |
| created_at, updated_at | timestamps | |

**Nota de design:** `admin_users` é a tabela de super-admins da plataforma (Control Plane). Separada de `users` (nível workspace) intencionalmente. Sem workspace_id.

### `settings`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | **nullable** — pode ser global |
| key | varchar | |
| value | text | |
| created_at, updated_at | timestamps | |
| UNIQUE | (workspace_id, key) | |

---

## Domínio 2 — Scheduling

### `professionals`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| name | varchar | |
| email | varchar | nullable |
| phone | varchar | nullable |
| specialty | varchar | nullable |
| is_active | boolean | default true |
| created_at, updated_at | timestamps | |

### `services`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| name | varchar | |
| duration_minutes | integer | |
| buffer_minutes | integer | default 0 |
| price | decimal(10,2) | |
| color | varchar | nullable |
| is_active | boolean | |
| description | text | nullable |
| created_at, updated_at | timestamps | |

### `professional_service` (pivot)
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| professional_id | bigint FK→professionals | cascade |
| service_id | bigint FK→services | cascade |
| created_at, updated_at | timestamps | |

**Nota:** Sem workspace_id — escopo indireto via professional/service.

### `professional_schedules`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| professional_id | bigint FK→professionals | cascade |
| weekday | tinyint | 0=Dom, 6=Sáb |
| start_time | time | |
| end_time | time | |
| break_start | time | nullable |
| break_end | time | nullable |
| is_active | boolean | |
| created_at, updated_at | timestamps | |
| UNIQUE | (professional_id, weekday) | |

### `holidays`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| name | varchar | |
| date | date | |
| professional_id | bigint FK→professionals | nullable |
| repeats_yearly | boolean | |
| created_at, updated_at | timestamps | |

### `appointments`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| customer_id | bigint FK→customers | |
| service_id | bigint FK→services | |
| professional_id | bigint FK→professionals | nullable, cascade |
| starts_at | datetime | INDEX |
| ends_at | datetime | |
| buffered_ends_at | datetime | nullable, INDEX |
| status | enum(scheduled, confirmed, canceled, completed, no_show) | |
| cancel_reason | varchar | nullable |
| confirmation_token | varchar UNIQUE | nullable |
| public_token | varchar UNIQUE | INDEX |
| confirmed_at | datetime | nullable |
| source | enum(admin, public_link) | |
| nps_score | tinyint | nullable |
| nps_comment | text | nullable |
| notes | text | nullable |
| created_at, updated_at | timestamps | |

**Índices compostos:**
- `[customer_id, starts_at]`
- `[professional_id, starts_at]`
- `[service_id, starts_at]`

### `waitlist_entries`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| customer_id | bigint FK→customers | |
| service_id | bigint FK→services | |
| professional_id | bigint FK→professionals | nullable |
| preferred_period | enum(morning, afternoon, night, any) | |
| notes | text | nullable |
| status | enum(waiting, called, converted, canceled) | |
| priority | integer | nullable |
| created_at, updated_at | timestamps | |

---

## Domínio 3 — Customers & CRM

### `customers`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| name | varchar | |
| phone | varchar | INDEX |
| email | varchar | nullable |
| document | varchar | nullable (CPF/CNPJ) |
| birth_date | date | nullable |
| notes | text | nullable |
| is_active | boolean | default true |
| current_segment | varchar | nullable, INDEX |
| deleted_at | timestamp | soft delete |
| created_at, updated_at | timestamps | |

### `customer_auth_tokens`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| customer_id | bigint FK→customers | |
| token | varchar(6) | código numérico |
| expires_at | datetime | |
| attempts | integer | default 0 |
| created_at, updated_at | timestamps | |

### `crm_actions`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| customer_id | bigint FK→customers | |
| type | varchar | reengagement, loyalty, review |
| status | varchar | |
| priority | integer | nullable |
| title | varchar | |
| description | text | nullable |
| action_data | JSON | |
| valid_until | datetime | nullable |
| created_at, updated_at | timestamps | |

**Índice:** `[workspace_id, status]`

---

## Domínio 4 — Operational Finance

### `charges`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| description | varchar | nullable |
| appointment_id | bigint FK→appointments | **nullable** (cobrança avulsa) |
| customer_id | bigint FK→customers | nullable |
| amount | decimal(12,2) | |
| status | enum(pending, paid, overdue, canceled, partial) | INDEX |
| due_date | date | INDEX |
| paid_at | datetime | nullable |
| payment_method | enum(pix, cash, card, transfer) | nullable |
| notes | text | nullable |
| reference_month | integer | nullable |
| reference_year | integer | nullable |
| reference_type | varchar | nullable (polimorfismo manual) |
| reference_id | bigint | nullable |
| payment_link_hash | varchar UNIQUE | nullable |
| payment_link_clicks | integer | default 0 |
| payment_link_expires_at | datetime | nullable |
| payment_provider_id | varchar | nullable, INDEX |
| external_reference | varchar | nullable |
| created_at, updated_at | timestamps | |

**Índices compostos:**
- `[appointment_id, status]`
- `[reference_type, reference_id]`

### `receipts`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| charge_id | bigint FK→charges | |
| amount_received | decimal(12,2) | |
| fee_amount | decimal(12,2) | default 0 |
| net_amount | decimal(12,2) | |
| method | varchar | |
| received_at | datetime | |
| notes | text | nullable |
| created_at, updated_at | timestamps | |

**Índice:** `[charge_id, received_at]`

### `wallets`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| customer_id | bigint FK→customers UNIQUE | 1:1 com customer |
| balance | decimal(12,2) | default 0 |
| created_at, updated_at | timestamps | |

**⚠️ Sem workspace_id — escopo indireto via customer.**

### `wallet_transactions`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| wallet_id | bigint FK→wallets | cascade |
| amount | decimal(12,2) | |
| type | varchar | credit, debit (sem enum) |
| description | varchar | nullable |
| reference_type | varchar | nullable |
| reference_id | bigint | nullable |
| created_at, updated_at | timestamps | |

**⚠️ Sem workspace_id. Sem índice em reference_id.**

### `packages`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | nullable, cascade |
| service_id | bigint FK→services | cascade |
| name | varchar | |
| description | text | nullable |
| sessions_count | integer | |
| price | decimal(12,2) | |
| validity_days | integer | default 90 |
| is_active | boolean | default true |
| created_at, updated_at | timestamps | |

### `customer_packages`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| customer_id | bigint FK→customers | cascade |
| package_id | bigint FK→packages | cascade |
| remaining_sessions | integer | |
| expires_at | date | nullable |
| status | varchar | active, expired, exhausted, canceled (sem enum) |
| created_at, updated_at | timestamps | |

**⚠️ Sem workspace_id — escopo indireto via customer.**

---

## Domínio 5 — Workspace Integrations

### `workspace_integrations`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| type | varchar | payment, messaging |
| provider | varchar | asaas, evolution |
| credentials | text | **encrypted** |
| status | varchar | active, inactive, error |
| meta | JSON | nullable |
| last_check_at | datetime | nullable |
| created_at, updated_at | timestamps | |

**Unique:** `[workspace_id, type, provider]`

---

## Domínio 6 — SaaS Billing & Subscriptions

### `plans`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| name | varchar | |
| slug | varchar UNIQUE | |
| price | decimal(10,2) | |
| billing_cycle | enum(monthly, yearly) | |
| is_active | boolean | |
| features | JSON | |
| created_at, updated_at | timestamps | |

### `workspace_subscriptions`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| plan_id | bigint FK→plans | cascade |
| status | **varchar** | trialing, active, overdue, canceled ⚠️ deveria ser enum |
| trial_ends_at | timestamp | nullable |
| starts_at | timestamp | nullable |
| ends_at | timestamp | nullable |
| canceled_at | timestamp | nullable |
| cancellation_category | varchar | nullable |
| cancellation_reason | text | nullable |
| cancellation_recorded_at | timestamp | nullable |
| canceled_by | varchar | nullable (customer/admin/system) ⚠️ deveria ser enum |
| winback_candidate | boolean | default false |
| grace_ends_at | timestamp | nullable |
| external_id | varchar | nullable |
| meta | JSON | nullable |
| created_at, updated_at | timestamps | |

### `workspace_billing_invoices`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| subscription_id | bigint FK→workspace_subscriptions | nullable |
| plan_id | bigint FK→plans | cascade |
| amount | decimal(10,2) | |
| status | enum(pending, paid, overdue, canceled) | |
| provider | varchar | asaas |
| provider_invoice_id | varchar | nullable |
| provider_payment_link | varchar | nullable |
| due_date | date | |
| paid_at | datetime | nullable |
| reference_period | varchar | nullable |
| meta | JSON | nullable |
| created_at, updated_at | timestamps | |

### `workspace_subscription_events`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | cascade |
| subscription_id | bigint FK→workspace_subscriptions | cascade |
| event_type | varchar | |
| payload | JSON | |
| created_at, updated_at | timestamps | |

**Índice:** `[workspace_id, event_type]`

---

## Domínio 7 — Revenue Ops / Retention

Coberto pelos campos de cancellation/retention em `workspace_subscriptions` e pela tabela de CRM actions.

Campos de retenção em `workspace_subscriptions`:
- `cancellation_category` — categoria do churn
- `cancellation_reason` — texto livre
- `cancellation_recorded_at` — quando foi processado
- `canceled_by` — agente do cancelamento
- `winback_candidate` — flag de reengajamento
- `grace_ends_at` — fim do período de graça

---

## Domínio 8 — Audit & Support Tables

### `audit_logs`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint FK→users | nullable |
| action | varchar | INDEX |
| entity | varchar | INDEX |
| entity_id | bigint | |
| payload | JSON | |
| ip | inet | |
| created_at | timestamp | INDEX |

**Índices:** `[entity, entity_id]`, `[action]`, `[created_at]`

### `reminder_logs`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| appointment_id | bigint FK→appointments | nullable |
| charge_id | bigint FK→charges | nullable |
| type | enum(...) | tipo do lembrete |
| channel | enum(whatsapp, telegram, sms) | |
| payload | JSON | |
| sent_at | datetime | nullable |
| status | enum(queued, sent, failed) | INDEX |
| error_message | text | nullable |
| created_at, updated_at | timestamps | |

**⚠️ Sem workspace_id — escopo indireto via appointment/charge.**

### `webhook_audits`
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| provider | varchar | |
| event_id | varchar | INDEX |
| processed_at | datetime | |

**Unique:** `[provider, event_id]` — idempotência de webhooks

### `personal_access_tokens`
Padrão Laravel Sanctum.

---

## Mapa de Relacionamentos por Domínio

```
WORKSPACE
  ├── users (N)
  ├── customers (N)
  │     ├── appointments (N)
  │     ├── charges (N via customer_id)
  │     ├── wallets (1) ⚠️ sem workspace_id
  │     │     └── wallet_transactions (N) ⚠️ sem workspace_id
  │     ├── customer_packages (N) ⚠️ sem workspace_id
  │     ├── crm_actions (N)
  │     └── customer_auth_tokens (N)
  ├── professionals (N)
  │     ├── professional_schedules (N)
  │     ├── services (N:N via professional_service)
  │     └── appointments (N)
  ├── services (N)
  │     ├── packages (N)
  │     └── appointments (N)
  ├── appointments (N)
  │     ├── charges (1, nullable) 
  │     └── reminder_logs (N) ⚠️ sem workspace_id
  ├── charges (N)
  │     ├── receipts (N)
  │     └── reminder_logs (N)
  ├── waitlist_entries (N)
  ├── holidays (N)
  ├── settings (N)
  ├── audit_logs (N via user)
  ├── webhook_audits (global)
  ├── workspace_integrations (N)
  ├── workspace_subscriptions (N)
  │     ├── workspace_billing_invoices (N)
  │     └── workspace_subscription_events (N)
  └── crm_actions (N)

PLATFORM (sem workspace_id)
  ├── admin_users
  ├── plans
  ├── sessions
  ├── cache / cache_locks
  ├── jobs / job_batches / failed_jobs
  └── password_reset_tokens
```

---

## Tabelas por workspace_id

| Tem workspace_id | Não tem (escopo indireto) | Platform |
|-----------------|--------------------------|----------|
| users | wallets | admin_users |
| customers | wallet_transactions | plans |
| professionals | customer_packages | personal_access_tokens |
| services | professional_service (pivot) | sessions |
| appointments | reminder_logs | webhook_audits |
| charges | audit_logs (via user) | cache, jobs, etc. |
| receipts | | |
| packages | | |
| professional_schedules | | |
| holidays | | |
| settings | | |
| waitlist_entries | | |
| crm_actions | | |
| workspace_integrations | | |
| workspace_subscriptions | | |
| workspace_billing_invoices | | |
| workspace_subscription_events | | |
| customer_auth_tokens | | |
