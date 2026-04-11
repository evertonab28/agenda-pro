# Migration Audit — Agenda Pro

**Sprint T2 · Data: 2026-04-09**
**Total de migrations:** 57
**Escopo:** Auditoria completa de estrutura, qualidade e consistência evolutiva

---

## 1. Inventário Completo por Fase

### Fase 0 — Bootstrap Laravel (3 migrations)
| # | Arquivo | Tabelas | Notas |
|---|---------|---------|-------|
| 1 | `0001_01_01_000000_create_users_table.php` | users, password_reset_tokens, sessions | Padrão Laravel 11 |
| 2 | `0001_01_01_000001_create_cache_table.php` | cache, cache_locks | Padrão Laravel 11 |
| 3 | `0001_01_01_000002_create_jobs_table.php` | jobs, job_batches, failed_jobs | Padrão Laravel 11 |

### Fase 1 — Domínio Inicial (single-tenant) (7 migrations)
| # | Arquivo | Tabelas | Notas |
|---|---------|---------|-------|
| 4 | `2026_03_22_024705_create_customers_table.php` | customers | Sem workspace_id, sem soft delete |
| 5 | `2026_03_22_024705_create_services_table.php` | services | Sem workspace_id |
| 6 | `2026_03_22_024706_create_appointments_table.php` | appointments | Sem workspace_id |
| 7 | `2026_03_22_024706_create_charges_table.php` | charges | appointment_id UNIQUE NOT NULL; design monolítico |
| 8 | `2026_03_22_024706_create_reminder_logs_table.php` | reminder_logs | Sem workspace_id |
| 9 | `2026_03_22_030821_create_personal_access_tokens_table.php` | personal_access_tokens | Sanctum |
| 10 | `2026_03_22_141527_create_receipts_table.php` | receipts | Sem workspace_id |

### Fase 2 — Expansão Incremental do Domínio (13 migrations)
| # | Arquivo | O que adiciona | Notas |
|---|---------|----------------|-------|
| 11 | `2026_03_22_032331_add_public_token_to_appointments_table.php` | public_token | |
| 12 | `2026_03_22_043507_add_dashboard_indexes_to_appointments_and_charges.php` | índices de performance | Deveria estar na criação |
| 13 | `2026_03_22_043731_add_role_to_users_table.php` | role | |
| 14 | `2026_03_22_050639_add_professional_id_to_appointments_table.php` | professional_id → users (FK errada) | FK corrigida depois |
| 15 | `2026_03_22_061331_add_fields_to_customers_table.php` | document, birth_date, is_active, soft delete | |
| 16 | `2026_03_22_141528_add_finance_fields_to_charges_table.php` | customer_id, description, notes | |
| 17 | `2026_03_22_143158_make_appointment_id_nullable_on_charges_table.php` | appointment_id nullable | Pivô de design: cobrança avulsa |
| 18 | `2026_03_22_162500_update_services_table.php` | active→is_active, color, description | |
| 19 | `2026_03_22_163000_create_professionals_and_pivot_table.php` | professionals, professional_service | |
| 20 | `2026_03_22_164000_create_schedules_holidays_settings.php` | professional_schedules, holidays, settings | |
| 21 | `2026_03_22_214257_add_status_to_users_table.php` | status | |
| 22 | `2026_03_23_010255_create_audit_logs_table.php` | audit_logs | |
| 23 | `2026_03_23_013613_add_unique_and_indexes_to_charges_and_receipts.php` | índices e unique | Deveria estar na criação |

### Fase 3 — Expansão de Agenda e Finanças (6 migrations)
| # | Arquivo | O que adiciona |
|---|---------|----------------|
| 24 | `2026_03_23_014956_add_buffer_and_cancel_fields_to_agenda_tables.php` | buffer_minutes, cancel_reason |
| 25 | `2026_03_23_015000_create_waitlist_entries_table.php` | waitlist_entries |
| 26 | `2026_03_23_020000_create_financial_expansion_tables.php` | wallets, wallet_transactions, packages, customer_packages |
| 27 | `2026_03_23_021000_add_reference_fields_to_charges_table.php` | reference_type, reference_id |
| 28 | `2026_03_23_030000_add_nps_fields_to_appointments_table.php` | nps_score, nps_comment |
| 29 | `2026_03_23_204546_add_partial_to_charges_status_enum.php` | status enum: + partial |

### Fase 4 — Pagamentos e Tenancy Inicial (6 migrations)
| # | Arquivo | O que adiciona |
|---|---------|----------------|
| 30 | `2026_03_23_215213_add_payment_link_fields_to_charges_table.php` | payment_link_hash, _clicks, _expires_at, payment_provider_id |
| 31 | `2026_03_23_223230_add_missing_fields_to_charges_table.php` | reference_month, reference_year |
| 32 | `2026_03_23_231242_create_clinics_table.php` | clinics (futuro workspaces) |
| 33 | `2026_03_23_231245_add_clinic_id_to_core_tables.php` | clinic_id → users, customers, appointments, charges |
| 34 | `2026_03_23_231436_create_webhook_audits_table.php` | webhook_audits |
| 35 | `2026_03_23_231933_add_clinic_id_to_remaining_core_tables.php` | clinic_id → services, professionals, packages |

### Fase 5 — Multi-tenancy Completo (7 migrations)
| # | Arquivo | O que adiciona |
|---|---------|----------------|
| 36 | `2026_03_23_233136_add_clinic_id_to_receipts_table.php` | clinic_id → receipts |
| 37 | `2026_03_23_234724_create_customer_auth_tokens_table.php` | customer_auth_tokens |
| 38 | `2026_03_25_133055_fix_professional_id_foreign_key_in_appointments.php` | Corrige FK professional_id: users → professionals |
| 39 | `2026_03_25_190238_add_clinic_id_to_waitlist_entries_table.php` | clinic_id → waitlist_entries |
| 40 | `2026_03_25_190405_create_crm_actions_table.php` | crm_actions |
| 41 | `2026_03_25_200000_add_clinic_id_to_schedules_and_holidays.php` | clinic_id → professional_schedules, holidays |
| 42 | `2026_03_25_215655_add_clinic_id_to_settings_table.php` | clinic_id → settings |
| 43 | `2026_03_25_234711_remove_unique_from_settings_key.php` | remove unique key (settings) |

### Fase 6 — Rename de Domínio: clinic → workspace (1 migration)
| # | Arquivo | Escopo |
|---|---------|--------|
| 44 | `2026_04_08_000001_rename_clinics_to_workspaces.php` | Renomeia tabela clinics → workspaces; clinic_id → workspace_id em 12 tabelas |

### Fase 7 — Billing e SaaS Platform (6 migrations)
| # | Arquivo | Tabelas |
|---|---------|---------|
| 45 | `2026_04_08_235311_add_indexes_to_external_ids.php` | índices em payment_provider_id, public_token |
| 46 | `2026_04_09_000929_create_workspace_integrations_table.php` | workspace_integrations |
| 47 | `2026_04_09_004838_create_plans_table.php` | plans |
| 48 | `2026_04_09_004839_create_workspace_subscriptions_table.php` | workspace_subscriptions |
| 49 | `2026_04_09_014721_create_workspace_billing_invoices_table.php` | workspace_billing_invoices |
| 50 | `2026_04_09_074432_create_workspace_subscription_events_table.php` | workspace_subscription_events |

### Fase 8 — Admin, Retenção e Expansão Final (7 migrations)
| # | Arquivo | O que adiciona | Notas |
|---|---------|----------------|-------|
| 51 | `2026_04_09_135833_create_admin_users_table.php` | admin_users | |
| 52 | `2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php` | — NADA — | **BUG: migration vazia** |
| 53 | `2026_04_09_151108_add_cancellation_metadata_to_workspace_subscriptions.php` | cancellation_recorded_at, canceled_by | |
| 54 | `2026_04_09_175548_add_retention_fields_to_workspace_subscriptions.php` | cancellation_category, cancellation_reason, winback_candidate | Nome duplicado da #52 |
| 55 | `2026_04_09_193422_add_current_segment_to_customers_table.php` | current_segment | |
| 56 | `2026_04_09_210952_add_buffered_ends_at_to_appointments_table.php` | buffered_ends_at | |

### Fase 9 — Sprint T4 Hardening (2 migrations)
| # | Arquivo | O que adiciona | Notas |
|---|---------|----------------|-------|
| 57 | `2026_04_10_000001_add_workspace_id_to_financial_tables.php` | workspace_id → wallets, wallet_transactions, customer_packages | Isolamento direto; backfill com orphan detection |
| 58 | `2026_04_11_001550_make_subscription_id_nullable_in_workspace_subscription_events.php` | subscription_id nullable → workspace_subscription_events | Suporta TrialEndingSoon sem subscription formal |

---

## 2. Problemas Identificados

### P1 — CRÍTICO: Migration vazia registrada no histórico
**Arquivo:** `2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php`

```php
// up() e down() são completamente vazios — Schema::table sem nenhuma instrução
Schema::table('workspace_subscriptions', function (Blueprint $table) {
    //
});
```

**Impacto:** A migration já rodou em todos os ambientes que fizeram `migrate`. Não tem como apagar do histórico sem `migrate:rollback`. É um ruído permanente no `migrations` table.

---

### P2 — CRÍTICO: Nome duplicado entre duas migrations
**Arquivos:**
- `2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php` (vazia)
- `2026_04_09_175548_add_retention_fields_to_workspace_subscriptions.php` (real)

Ambas têm o mesmo nome lógico. Gera confusão em revisões, `git log`, e qualquer ferramenta que indexe migrations por nome.

---

### P3 — CRÍTICO: `down()` completamente quebrado em duas migrations

**Arquivo 1:** `2026_03_23_231245_add_clinic_id_to_core_tables.php`
```php
// down() só tem Schema::table('users') com corpo vazio
// customers, appointments e charges NÃO são revertidos
```

**Arquivo 2:** `2026_03_23_231933_add_clinic_id_to_remaining_core_tables.php`
```php
// down() referencia tabela inexistente:
Schema::table('remaining_core_tables', function (Blueprint $table) {
    //
});
```

**Impacto:** `php artisan migrate:rollback` falha ou produz estado inconsistente a partir dessas migrations. Reprodutibilidade completa está quebrada.

---

### P4 — ALTO: FK errada no design inicial (corrigida tardiamente)
**Arquivo:** `2026_03_22_050639_add_professional_id_to_appointments_table.php`

O campo `professional_id` foi originalmente criado com FK para `users`. A migration `fix_professional_id_foreign_key_in_appointments.php` (Fase 5) corrigiu para `professionals`. Indica que o modelo de `Professional` como entidade separada de `User` não estava no design original.

---

### P5 — ALTO: Tabelas financeiras sem workspace_id (escopo indireto)
**Tabelas afetadas:** `wallets`, `wallet_transactions`, `customer_packages`

Essas tabelas não têm `workspace_id`. O escopo multi-tenant é **indireto** via `customer_id → customers.workspace_id`. Isso significa:
- Queries multi-tenant sempre exigem JOIN com `customers`
- Não é possível fazer queries de wallet por workspace sem esse JOIN
- Risco de vazamento cross-tenant se a query esquecer o JOIN

**Nota:** `packages` recebeu `workspace_id` (via clinic_id na Fase 4), mas `customer_packages` não.

---

### P6 — ALTO: `charges` cresceu em 5+ ondas de migration

A tabela `charges` foi criada com design monolítico (appointment_id UNIQUE NOT NULL) e expandida incrementalmente:
1. Criação: 10 colunas, appointment_id único
2. +finance_fields: customer_id, description, notes
3. +appointment_id nullable: pivô de design
4. +reference_fields: reference_type, reference_id (polimorfismo manual)
5. +payment_link_fields: payment_link_hash, _clicks, _expires_at, payment_provider_id
6. +missing_fields: reference_month, reference_year
7. +partial no enum (DDL separado para enum)

Resultado: tabela com 20+ colunas que mistura responsabilidades de cobrança operacional e financeiro.

---

### P7 — MÉDIO: Inconsistência de tipo em campos de status/enum

| Tabela | Campo | Tipo usado | Deveria ser |
|--------|-------|------------|-------------|
| workspace_subscriptions | status | `string()` | `enum()` |
| customer_packages | status | `string()` | `enum()` |
| workspace_subscriptions | canceled_by | `string()` (com comment) | `enum()` |
| wallet_transactions | type | `string()` | `enum()` |

O projeto usa `enum()` consistentemente em outras tabelas (appointments, charges, reminder_logs), mas as tabelas de billing e pacotes usam `string()`.

---

### P8 — MÉDIO: Índices adicionados em onda separada (deviam estar na criação)

- `add_dashboard_indexes_to_appointments_and_charges` (Fase 2) — índices básicos de performance que deveriam estar nas migrations de criação
- `add_unique_and_indexes_to_charges_and_receipts` (Fase 2) — mesmo caso
- `add_indexes_to_external_ids` (Fase 7) — mesmo caso

Padrão recorrente: tabela criada sem índices → índices adicionados depois. Aceitável em histórico real, mas indica ausência de planejamento de acesso inicial.

---

### P9 — MÉDIO: Código morto no fix de FK profissional

**Arquivo:** `2026_03_25_133055_fix_professional_id_foreign_key_in_appointments.php`
```php
if (config('database.default') === 'sqlite') {
    // SQLite doesn't support dropping foreign keys easily...
    // Actually, standard Laravel way works in most modern SQLite versions...
}
// corpo vazio — não faz nada
```

O bloco condicional existe como comentário explicativo mas não executa nada. Código morto.

---

### P10 — BAIXO: Formatação inconsistente na migration de criação de charges

**Arquivo:** `2026_03_22_024706_create_charges_table.php`

Toda a migration está sem indentação (código na coluna 0). Inconsistente com o padrão PSR-12 de todas as demais migrations.

---

### P11 — BAIXO: Missing indexes em wallet_transactions

`wallet_transactions.reference_id` não tem índice. Para polimorfismo via `reference_type/reference_id`, o índice composto é essencial para performance.

---

## 3. Tabela de Prioridade Técnica (Score)

| ID | Problema | Impact | Risk | Effort | Score |
|----|----------|--------|------|--------|-------|
| P3 | down() quebrado em 2 migrations | 4 | 5 | 2 | **27** |
| P5 | wallets/wallet_transactions sem workspace_id | 4 | 4 | 3 | **24** |
| P1 | Migration vazia no histórico | 3 | 3 | 1 | **30** |
| P2 | Nome duplicado entre migrations | 3 | 2 | 1 | **25** |
| P6 | charges com 20+ colunas misturando responsabilidades | 3 | 3 | 5 | **12** |
| P7 | string() em vez de enum() | 2 | 2 | 2 | **16** |
| P8 | Índices adicionados em onda separada | 2 | 2 | 4 | **12** |
| P9 | Código morto no fix FK | 1 | 1 | 1 | **10** |
| P4 | FK errada original (já corrigida) | 1 | 1 | 4 | **4** |

_Score = (Impact + Risk) × (6 - Effort)_

---

## 4. Histórico de Evolução do Schema

```
2026-03-22  Bootstrap single-tenant (customers, services, appointments, charges)
            ↓ design monolítico: charge sempre vinculada a appointment
2026-03-22  Expansão domínio: professionals, professional_schedules, holidays, settings
            ↓ professional como entidade separada de user
2026-03-23  Pivô financeiro: charges desacopla de appointments (nullable)
            ↓ cobrança avulsa passa a existir
2026-03-23  Expansão financeira: wallets, packages, customer_packages
            ↓ sem workspace_id nesses novos objetos financeiros
2026-03-23  Multi-tenancy retroativo: clinic_id adicionado em ondas
            ↓ 5 migrations separadas para espalhar clinic_id
2026-03-25  Correção de design: FK professional_id apontando para tabela errada
2026-04-08  Rename de domínio: clinic → workspace (migration atômica em 13 tabelas)
2026-04-09  SaaS Billing: plans, subscriptions, invoices, integrations
            ↓ billing usando string() em vez de enum() para status
2026-04-09  Retenção: 3 migrations em sequência; 1 delas vazia
```

---

## Sprint T4 — Hardening Audit (2026-04-10)

### Migrations com `down()` incompleto (não corrigíveis sem rollback manual)

As seguintes migrations têm `down()` incompleto e **não devem ser revertidas com `migrate:rollback`** em ambientes com dados:

| Migration | Problema | Impacto se revertida |
|-----------|----------|---------------------|
| `2026_03_23_231245_add_clinic_id_to_core_tables.php` | `down()` tem corpo vazio — não dropa `clinic_id` de users, customers, appointments, charges | Schema inconsistente |
| `2026_03_23_231933_add_clinic_id_to_remaining_core_tables.php` | `down()` referencia tabela inexistente `remaining_core_tables` | Erro de schema no rollback |
| `2026_03_23_233136_add_clinic_id_to_receipts_table.php` | `down()` tem corpo vazio — não dropa `clinic_id` de receipts | Schema inconsistente |

**Ação adotada:** Comentários de aviso foram adicionados diretamente nos arquivos.

**Regra de CI:** Em ambientes efêmeros (CI/CD), usar sempre `php artisan migrate:fresh --seed` em vez de `migrate:rollback`.

---

### Migration vazia (placeholder)

| Migration | Status |
|-----------|--------|
| `2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php` | Placeholder vazio commitado acidentalmente. Campos de retenção foram adicionados nas migrations `_175548` e `_151108`. Comentário explicativo adicionado no arquivo. |

---

### Nova migration adicionada na Sprint T4

| Migration | O que faz |
|-----------|----------|
| `2026_04_10_000001_add_workspace_id_to_financial_tables.php` | Adiciona `workspace_id` em `wallets`, `wallet_transactions`, `customer_packages`. Faz backfill com orphan detection. Adiciona índices e FKs (MySQL). Também adiciona índice composto em `wallet_transactions(reference_type, reference_id)`. |

---

### Extra migration adicionada para suportar TrialEndingSoon

| Migration | O que faz |
|-----------|----------|
| `2026_04_11_001550_make_subscription_id_nullable_in_workspace_subscription_events.php` | Torna `subscription_id` nullable em `workspace_subscription_events` para suportar eventos de trial que não possuem subscription formal ainda. |

---

## 5. Resumo de Saúde por Fase

| Fase | Migrations | Estado | Principal risco |
|------|-----------|--------|-----------------|
| Bootstrap (F0) | 3 | Saudável | Nenhum |
| Domínio inicial (F1) | 7 | Aceitável | Design single-tenant intencional |
| Expansão incremental (F2) | 13 | Aceitável | Índices tardios |
| Agenda + Finanças (F3) | 6 | Aceitável | Falta workspace_id nos financeiros |
| Pagamentos + Tenancy (F4) | 6 | Aceitável | down() frágil |
| Multi-tenancy completo (F5) | 8 | Problema | **down() quebrado em 2 migrations** |
| Rename clinic→workspace (F6) | 1 | Saudável | Operação arriscada mas bem implementada |
| Billing SaaS (F7) | 6 | Aceitável | string() vs enum() |
| Admin + Retenção (F8) | 7 | Problema | **Migration vazia + nome duplicado** |
| Sprint T4 Hardening (F9) | 2 | Saudável | ✅ workspace_id adicionado com segurança |
