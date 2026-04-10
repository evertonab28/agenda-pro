# Schema Overview — Visão por Domínio

Todas as tabelas de negócio são multi-tenant via `workspace_id`. O `TenantScope` aplica automaticamente o filtro por workspace nas queries via guard `web` (staff) ou `customer` (portal). Use `withoutGlobalScopes()` para consultas cross-tenant (admin, schedulers).

---

## Multi-tenancy

**Tabelas com `workspace_id`:** appointments, charges, customers, professionals, services, holidays, professional_schedules, settings, waitlist_entries, workspace_integrations, receipts, crm_actions, workspace_subscriptions, workspace_billing_invoices, workspace_subscription_events

**Soft delete:** apenas `customers`.

**Cascade:** delete de workspace cascateia para todas as tabelas filhas. Delete de customer cascateia para appointments, wallet, customer_packages, waitlist_entries, crm_actions, customer_auth_tokens.

---

## Domínio 1 — Agendamento

### `workspaces`
Entidade raiz. Toda operação é filtrada por workspace.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | PK | |
| `name` | string | |
| `slug` | string unique | Route model binding usa slug |
| `status` | enum | `active`, `inactive` |

### `professionals`
Staff que presta serviços.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | PK | |
| `workspace_id` | FK | |
| `name`, `email`, `phone`, `specialty` | | |
| `is_active` | bool | |

### `services`
Serviços oferecidos pelo workspace.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | PK | |
| `workspace_id` | FK | |
| `name`, `price` | | |
| `duration_minutes` | int | |
| `buffer_minutes` | int default 0 | Tempo de intervalo após o serviço |
| `is_active` | bool | |

**Atenção:** delete de service é `restrictOnDelete` — não pode deletar service com appointments vinculados.

### `professional_service` (pivot)
Many-to-many entre professionals e services.

### `appointments`
Agendamentos. Tabela central do negócio.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | PK | |
| `workspace_id` | FK | |
| `customer_id` | FK cascade | |
| `service_id` | FK restrict | Impede delete se tiver appointment |
| `professional_id` | FK nullOnDelete | |
| `starts_at` | datetime | Index |
| `ends_at` | datetime | |
| `buffered_ends_at` | datetime nullable | Index; calculado via observer |
| `status` | enum | `scheduled`, `confirmed`, `no_show`, `completed`, `canceled`, `rescheduled` |
| `public_token` | string unique nullable | Usado em webhooks de mensageria |
| `confirmation_token` | string unique nullable | |
| `confirmed_at` | datetime nullable | |
| `source` | enum | `admin`, `public_link` |
| `nps_score` | tinyint nullable | 0–10 |
| `nps_comment` | text nullable | |

**Índices:** `(customer_id, starts_at)`, `(professional_id, starts_at)`, `starts_at`, `status`

### `professional_schedules`
Disponibilidade semanal recorrente por profissional.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `professional_id` | FK cascade | |
| `weekday` | tinyint | 0=Dom, 6=Sáb |
| `start_time`, `end_time` | time | |
| `break_start`, `break_end` | time nullable | Intervalo/almoço |
| `is_active` | bool | |

Constraint única: `(professional_id, weekday)`.

### `holidays`
Datas bloqueadas (feriados ou folgas).

| Coluna | Tipo | Notas |
|--------|------|-------|
| `workspace_id` | FK | |
| `professional_id` | FK nullOnDelete nullable | null = bloqueio do workspace inteiro |
| `name` | string | |
| `date` | date | |
| `repeats_yearly` | bool | |

---

## Domínio 2 — Clientes

### `customers`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | PK | |
| `workspace_id` | FK | |
| `name`, `phone`, `email`, `document` | | phone normalizado (só dígitos) |
| `birth_date` | date nullable | |
| `is_active` | bool | Index |
| `current_segment` | string nullable | Index; valores do CRM: `VIP`, `Recorrente`, `Ativo`, `Em Risco`, `Inativo`, `Novo` |
| `deleted_at` | timestamp nullable | Soft delete |

### `customer_auth_tokens`
Tokens OTP de 6 dígitos para autenticação no portal.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `customer_id` | FK cascade | |
| `token` | string(6) | |
| `expires_at` | timestamp | |
| `attempts` | int default 0 | Bloqueio após 5 tentativas |

`isValid()`: não expirado E attempts < 5.

### `waitlist_entries`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `customer_id` | FK cascade | |
| `service_id` | FK cascade | |
| `professional_id` | FK nullOnDelete nullable | |
| `preferred_period` | enum | `morning`, `afternoon`, `night`, `any` |
| `status` | enum | `waiting`, `called`, `converted`, `canceled` |
| `priority` | int | Ordenação para oferta de horários |

---

## Domínio 3 — Financeiro

### `charges`
Cobranças individuais.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | PK | |
| `workspace_id` | FK | |
| `appointment_id` | FK cascade unique nullable | 1 cobrança por agendamento |
| `customer_id` | FK nullOnDelete nullable | |
| `amount` | decimal(10,2) | |
| `status` | enum | `pending`, `paid`, `overdue`, `canceled`, `partial` |
| `due_date` | date | |
| `paid_at` | datetime nullable | |
| `payment_method` | enum nullable | `pix`, `cash`, `card`, `transfer` |
| `payment_link_hash` | string unique nullable | Link de pagamento compartilhável |
| `payment_link_clicks` | int | |
| `payment_link_expires_at` | timestamp nullable | |
| `payment_provider_id` | string nullable | ID externo no Asaas |
| `reference_type` / `reference_id` | | Sistema polimórfico de referência |

**Índices:** `status`, `(appointment_id, status)`, `(reference_type, reference_id)`

### `receipts`
Recibos de pagamento. Múltiplos recibos por cobrança (pagamentos parciais).

| Coluna | Tipo | Notas |
|--------|------|-------|
| `charge_id` | FK cascade | |
| `amount_received` | decimal(12,2) | |
| `fee_amount` | decimal(12,2) | Taxa do gateway |
| `net_amount` | decimal(12,2) | amount_received - fee_amount |
| `method` | string | |
| `received_at` | datetime | |

### `wallets`
Saldo pré-pago por cliente. Um wallet por customer.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `customer_id` | FK unique cascade | |
| `balance` | decimal(12,2) | |

### `wallet_transactions`
Log imutável de movimentações do wallet.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `wallet_id` | FK cascade | |
| `amount` | decimal(12,2) | |
| `type` | string | `credit`, `debit` |
| `reference_type` / `reference_id` | | `appointment`, `charge`, `package` |

### `packages`
Pacotes de sessões com desconto.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `service_id` | FK cascade | |
| `sessions_count` | int | |
| `price` | decimal(12,2) | Preço total do pacote |
| `validity_days` | int default 90 | |
| `is_active` | bool | |

### `customer_packages`
Instância de pacote comprado por cliente.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `customer_id` | FK cascade | |
| `package_id` | FK cascade | |
| `remaining_sessions` | int | Contador regressivo |
| `expires_at` | date nullable | |
| `status` | string | `active`, `expired`, `exhausted`, `canceled` |

`isActive()`: status=active E (expires_at null ou futuro) E remaining_sessions > 0.

---

## Domínio 4 — CRM

### `crm_actions`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `workspace_id` | FK | |
| `customer_id` | FK cascade | |
| `type` | string | `reengagement`, `loyalty`, `review`, etc. |
| `status` | string | `pending`, `done`, `dismissed` |
| `priority` | string | `low`, `medium`, `high` |
| `title`, `description` | | |
| `action_data` | json nullable | Metadados (ex: cupom de desconto) |
| `valid_until` | timestamp nullable | |

**Índice:** `(workspace_id, status)`

---

## Domínio 5 — SaaS Billing

### `plans`
Planos globais do SaaS (não tenant-scoped).

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | PK | |
| `name` | string | |
| `slug` | string unique | |
| `price` | decimal(10,2) | |
| `billing_cycle` | string | `monthly`, `yearly` |
| `is_active` | bool | |
| `features` | json nullable | Limites e flags de features |

### `workspace_subscriptions`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `workspace_id` | FK cascade | |
| `plan_id` | FK cascade | |
| `status` | string | `trialing`, `active`, `overdue`, `canceled` |
| `trial_ends_at` | timestamp nullable | |
| `starts_at`, `ends_at` | timestamp nullable | |
| `canceled_at` | timestamp nullable | |
| `grace_ends_at` | timestamp nullable | |
| `cancellation_category` | string nullable | Categoria de churn |
| `cancellation_reason` | string nullable | Detalhamento do churn |
| `cancellation_recorded_at` | timestamp nullable | |
| `canceled_by` | string nullable | Email ou 'system' |
| `winback_candidate` | bool | Alvo de reativação |
| `external_id` | string nullable | ID no gateway externo |

`isActive()`: trialing (trial futuro) OU active/canceled (ends_at futuro ou null).

### `workspace_billing_invoices`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `workspace_id` | FK cascade | |
| `subscription_id` | FK setNull nullable | |
| `plan_id` | FK cascade | |
| `amount` | decimal(10,2) | |
| `status` | string | `pending`, `paid`, `overdue`, `canceled` |
| `provider` | string | `asaas` (default) |
| `provider_invoice_id` | string nullable | ID no Asaas |
| `provider_payment_link` | text nullable | Link de pagamento |
| `due_date` | date | |
| `paid_at` | timestamp nullable | |
| `reference_period` | string | Ex: `2026-04` |

Constraint de idempotência em código: `(workspace_id, reference_period)` não duplica.

### `workspace_subscription_events`
Log de ciclo de vida das assinaturas.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `workspace_id` | FK cascade | |
| `subscription_id` | FK cascade | |
| `event_type` | string | `trial_started`, `trial_expired`, `subscription_activated`, `subscription_overdue`, `subscription_canceled`, `subscription_reactivated`, `invoice_generated`, `invoice_paid`, `invoice_overdue`, `plan_changed`, `plan_upgraded`, etc. |
| `payload` | json nullable | |

**Índice:** `(workspace_id, event_type)`

---

## Domínio 6 — Plataforma / Auth

### `users`
Usuários staff do workspace.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `workspace_id` | FK nullable cascade | |
| `name`, `email` | | email unique |
| `password` | string hashed | |
| `role` | string nullable | |
| `status` | string | |

Guard: `web`.

### `admin_users`
Admins da plataforma. Não tem `workspace_id` — acesso cross-tenant.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `name`, `email` | | email unique |
| `password` | string hashed | |

Guard: `admin` (separado).

### `workspace_integrations`
Ver [docs/ops/integrations.md](integrations.md) para detalhes operacionais.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `workspace_id` | FK cascade | |
| `type` | string | `payment`, `messaging` |
| `provider` | string | `asaas`, `evolution`, etc. |
| `credentials` | encrypted array | Decriptado automaticamente |
| `status` | string | `active`, `inactive`, `error` |
| `meta` | json nullable | webhook_secret, config extras |
| `last_check_at` | timestamp nullable | |

Unique: `(workspace_id, type, provider)`.

### `settings`
Configurações chave-valor por workspace.

```php
Setting::get('key');                              // workspace atual
Setting::set('key', 'value');                     // workspace atual
Setting::getForWorkspace($workspaceId, 'key');    // workspace específico
```

---

## Domínio 7 — Auditoria e Ops

### `reminder_logs`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `appointment_id` | FK nullOnDelete nullable | |
| `charge_id` | FK nullOnDelete nullable | |
| `type` | enum | `confirm_d1`, `confirm_h2`, `charge_d1`, `charge_d3`, `reactivation` |
| `channel` | enum | `whatsapp`, `telegram`, `sms` |
| `status` | enum | `queued`, `sent`, `failed` |
| `error_message` | text nullable | |

### `audit_logs`
Trilha imutável de ações de usuários.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `user_id` | FK nullOnDelete nullable | |
| `action` | string | Ex: `appointment.created` |
| `entity` | string | Ex: `Appointment` |
| `entity_id` | bigint nullable | PK da entidade |
| `payload` | json nullable | |
| `ip` | ipAddress nullable | |
| `created_at` | timestamp | Sem updated_at (imutável) |

**Índices:** `(entity, entity_id)`, `action`, `created_at`

### `webhook_audits`
Deduplicação de webhooks externos. Ver [docs/ops/webhooks.md](webhooks.md).

| Coluna | Tipo | Notas |
|--------|------|-------|
| `provider` | string | `asaas`, `evolution`, etc. |
| `event_id` | string | Index |
| `processed_at` | timestamp | Sem updated_at |

Unique: `(provider, event_id)`. Purgado a cada 90 dias.

---

## Relações Principais

```
Workspace
├── users
├── professionals ──── professional_schedules
│                 └─── holidays
├── services ─────── professional_service ───── professionals
├── customers ──────── appointments ─── charges ─── receipts
│           │                       └── reminder_logs
│           ├── wallet ──── wallet_transactions
│           ├── customer_packages ─── packages ─── services
│           ├── waitlist_entries
│           ├── customer_auth_tokens
│           └── crm_actions
├── workspace_integrations
├── workspace_subscriptions ─── workspace_subscription_events
│                           └── workspace_billing_invoices
└── settings
```

---

## Observações Importantes

- **Renomeação clinic→workspace** (2026-04-08): migração completa, sem referências a `clinic_id` no código ativo.
- **Charges polimórficas:** `reference_type`/`reference_id` permitem vincular cobranças a appointments, packages ou entidades customizadas.
- **Charges sem appointment:** possível (`appointment_id` nullable) — útil para cobranças avulsas.
- **`buffered_ends_at`** calculado via `AppointmentObserver` ao salvar — nunca editar diretamente.
- **Idempotência de invoices SaaS:** verificada em código por `(workspace_id, reference_period)`, sem constraint de banco.
- **Eventos de assinatura:** criados pelo sistema, nunca por input direto de usuário.
