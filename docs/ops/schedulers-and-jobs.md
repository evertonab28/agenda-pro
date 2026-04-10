# Schedulers, Jobs e Comandos — Operação e Debug

Referência completa do que roda automaticamente, com que frequência, e como intervir manualmente.

---

## Scheduler — Visão Geral

Definido em `routes/console.php` (padrão Laravel 11). Requer `php artisan schedule:run` rodando a cada minuto via cron:

```cron
* * * * * cd /var/www && php artisan schedule:run >> /dev/null 2>&1
```

### O que roda automaticamente

| Comando | Frequência | Finalidade |
|---------|-----------|-----------|
| `reminders:dispatch` | A cada 10 min | Despacha lembretes de confirmação e cobrança |
| `finance:mark-overdue` | Diariamente | Marca cobranças vencidas como `overdue` |
| `saas:billing-recurring` | Diariamente | Gera invoices de renovação |
| `saas:billing-dunning` | Diariamente | Marca assinaturas vencidas, registra eventos |
| `db:purge-security-logs` | Semanalmente | Limpa audit_logs e webhook_audits antigos (LGPD) |

### Comandos só manuais (não agendados)

| Comando | Finalidade |
|---------|-----------|
| `crm:recalculate-segments` | Recalcula segmento de todos os clientes |
| `crm:re-engage` | Cria ações de reengajamento para clientes inativos |
| `saas:retention-ops` | Dunning manual e alertas de trial |
| `scheduling:sync-buffers` | Recalcula `buffered_ends_at` em todos os agendamentos |

---

## Comandos — Referência Detalhada

### `reminders:dispatch`
**Arquivo:** `app/Console/Commands/DispatchRemindersCommand.php`  
**Frequência:** a cada 10 minutos

Despacha 4 tipos de lembrete:
| Tipo | Gatilho | Canal |
|------|---------|-------|
| `confirm_d1` | Agendamento amanhã | WhatsApp |
| `confirm_h2` | Agendamento em 2 horas | WhatsApp |
| `charge_d1` | Cobrança venceu há 1 dia | WhatsApp |
| `charge_d3` | Cobrança venceu há 3 dias | WhatsApp |

**Idempotência:** SIM — verifica `ReminderLog::alreadySent()` antes de despachar. Se já existe registro com status `queued` ou `sent`, não despacha novamente.

**Como rodar manualmente:**
```bash
php artisan reminders:dispatch
```

**Investigar falhas:**
```sql
SELECT * FROM reminder_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 50;
```

---

### `finance:mark-overdue`
**Arquivo:** `app/Console/Commands/MarkChargesOverdue.php`  
**Frequência:** diariamente

Faz bulk update: `charges` com `status IN ('pending', 'partial')` e `due_date < hoje` → `status = 'overdue'`.

**Idempotência:** SIM — cobranças já `overdue` não são afetadas.

**Como rodar manualmente:**
```bash
php artisan finance:mark-overdue
```

**Verificar cobranças que deveriam ter sido marcadas:**
```sql
SELECT COUNT(*) FROM charges WHERE due_date < CURDATE() AND status NOT IN ('overdue','paid','canceled');
```

---

### `saas:billing-recurring`
**Arquivo:** `app/Console/Commands/ProcessRecurringBilling.php`  
**Frequência:** diariamente

Gera invoices de renovação para assinaturas `active` com `ends_at <= agora + 5 dias`.

**Idempotência:** SIM — verifica se já existe invoice para `(workspace_id, reference_period)` com status `pending` ou `paid` antes de criar.

**Como rodar manualmente:**
```bash
php artisan saas:billing-recurring
```

**Verificar próximas renovações:**
```sql
SELECT id, workspace_id, status, ends_at
FROM workspace_subscriptions
WHERE status = 'active' AND ends_at <= DATE_ADD(NOW(), INTERVAL 5 DAY);
```

---

### `saas:billing-dunning`
**Arquivo:** `app/Console/Commands/ProcessOverdueSubscriptions.php`  
**Frequência:** diariamente

Processa:
1. Assinaturas `active`/`trialing` com `ends_at` ou `trial_ends_at` vencidos → `status = 'overdue'`
2. Cria eventos `subscription_overdue` e `trial_ended` em `workspace_subscription_events`

**Idempotência:** PARCIAL ⚠️ — não verifica se assinatura já está `overdue`. Pode criar eventos duplicados se rodado duas vezes.

**Como rodar manualmente:**
```bash
php artisan saas:billing-dunning
```

**Verificar subscriptions que deveriam ser processadas:**
```sql
SELECT id, workspace_id, status, ends_at, trial_ends_at
FROM workspace_subscriptions
WHERE status IN ('active','trialing')
  AND (ends_at < NOW() OR trial_ends_at < NOW());
```

---

### `saas:retention-ops`
**Arquivo:** `app/Console/Commands/ProcessRetentionAndDunningOps.php`  
**Frequência:** manual

Processa lembretes de dunning e alertas de expiração de trial via serviços de retenção.

```bash
php artisan saas:retention-ops
```

---

### `crm:recalculate-segments`
**Arquivo:** `app/Console/Commands/CRM/CRMReEngage.php`  
**Frequência:** manual

Despacha `UpdateCustomerSegmentJob` para todos os clientes (via `withoutGlobalScopes()`).

**Idempotência:** NÃO ⚠️ — despacha jobs para todos os clientes a cada execução. Em lotes grandes pode encher a fila.

```bash
php artisan crm:recalculate-segments
```

---

### `crm:re-engage`
**Arquivo:** `app/Console/Commands/CRM/CRMReEngage.php`  
**Frequência:** manual

Cria `CRMAction` de reengajamento para clientes com `segment = 'Inativo'`.

**Idempotência:** SIM — verifica se já existe `CRMAction` para `(workspace_id, customer_id, type='reengagement', status='pending')`.

```bash
php artisan crm:re-engage
```

---

### `db:purge-security-logs`
**Arquivo:** `app/Console/Commands/Security/`  
**Frequência:** semanalmente

Deleta registros de `audit_logs` e `webhook_audits` mais antigos que N dias (padrão: 90).

**Idempotência:** SIM

```bash
php artisan db:purge-security-logs           # padrão: 90 dias
php artisan db:purge-security-logs --days=30 # reter apenas 30 dias
```

---

### `scheduling:sync-buffers`
**Arquivo:** `app/Console/Commands/Scheduling/`  
**Frequência:** manual

Re-salva todos os agendamentos para recalcular `buffered_ends_at` via observer.

**Atenção:** Lento em bases grandes (operação N+1).

```bash
php artisan scheduling:sync-buffers
```

---

## Jobs de Fila

### `SendReminderJob`
**Arquivo:** `app/Jobs/SendReminderJob.php`

Despacha lembrete via WhatsApp para um agendamento ou cobrança.

**Fluxo:**
1. Busca agendamento/cobrança com relacionamentos
2. Extrai telefone do cliente e workspace
3. Constrói mensagem baseada no tipo (`confirm_d1`, etc.)
4. Envia via `MessagingService`
5. Registra resultado em `reminder_logs` (status: `sent` ou `failed`)

**Falhas silenciosas (retorna sem erro):**
- Cliente sem telefone → `reminder_logs.status = 'failed'`, erro "Cliente sem telefone"
- Workspace não encontrado → warning no log, retorna

**Falhas que vão para `failed_jobs`:**
- Serviço de mensageria indisponível → retries conforme config da fila

---

### `UpdateCustomerSegmentJob`
**Arquivo:** `app/Jobs/CRM/UpdateCustomerSegmentJob.php`

Atualiza `customers.current_segment` baseado no histórico de agendamentos.

**Lógica de segmento:**
| Condição | Segmento |
|----------|---------|
| Sem agendamentos + criado > 60 dias | `Inativo` |
| Sem agendamentos + criado < 60 dias | `Novo` |
| Último agendamento > 60 dias | `Inativo` |
| Último agendamento > 30 dias | `Em Risco` |
| ≥ 10 agendamentos concluídos | `VIP` |
| ≥ 3 agendamentos concluídos | `Recorrente` |
| Outros | `Ativo` |

**Disparado por:** `crm:recalculate-segments` e `AppointmentObserver` (create/update/delete).

---

## Configuração de Fila

**Driver padrão:** `database` (tabela `jobs`)  
**Retry after:** 90 segundos  
**Failed jobs:** tabela `failed_jobs`

**Em produção (Horizon / Redis):**
- Workers: 10 (produção), 3 (local)
- Timeout: 60 segundos
- Memória: 128MB por processo
- Dashboard: `/horizon`

**Iniciar worker:**
```bash
php artisan queue:work              # database driver
php artisan horizon                 # se usar Redis/Horizon
```

---

## Riscos de Duplicação

| Comando | Risco | Detalhes |
|---------|-------|---------|
| `reminders:dispatch` | Baixo | Protegido via `ReminderLog` |
| `finance:mark-overdue` | Médio | Bulk update sem lock; idempotente no resultado |
| `saas:billing-dunning` | Médio ⚠️ | Pode criar eventos duplicados |
| `saas:billing-recurring` | Baixo | Protegido por `reference_period` |
| `crm:recalculate-segments` | Médio ⚠️ | Enfileira jobs para todos os clientes novamente |
| `crm:re-engage` | Baixo | Protegido via `CRMAction` |

---

## Troubleshooting

### Lembretes não estão sendo enviados
1. Verificar se queue worker está rodando: `php artisan queue:work`
2. Checar telefones ausentes: `SELECT COUNT(*) FROM customers WHERE phone IS NULL`
3. Verificar integração de mensageria do workspace (status = 'active')
4. Consultar `failed_jobs` e `reminder_logs`

### Cobranças não sendo marcadas como vencidas
```bash
php artisan schedule:list                        # verificar se agendado
php artisan finance:mark-overdue                 # rodar manualmente
```

### Invoice de renovação não gerada
```bash
php artisan saas:billing-recurring               # rodar manualmente
# Verificar se já existe invoice para o período (reference_period):
SELECT * FROM workspace_billing_invoices WHERE workspace_id = X ORDER BY created_at DESC LIMIT 5;
```

### Assinatura não marcada como overdue
```bash
php artisan saas:billing-dunning
# Verificar:
SELECT * FROM workspace_subscriptions WHERE id = X;
# ends_at < agora? status = 'active'? Se sim, o comando deveria ter processado.
```

### Jobs acumulando na fila
```sql
SELECT COUNT(*), queue FROM jobs GROUP BY queue;
```
```bash
php artisan queue:retry all       # reprocessar failed jobs
php artisan queue:clear           # CUIDADO: descarta todos os jobs pendentes
```

### Verificar próxima execução do scheduler
```bash
php artisan schedule:list
php artisan schedule:test --name="reminders:dispatch"   # teste sem executar
```
