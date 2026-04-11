# Billing SaaS — Operação e Debug

Documentação do ciclo de vida de assinaturas, invoices e dunning do Agenda Pro SaaS.

---

## Planos (`plans`)

Tabela global — não é tenant-scoped.

| Campo | Descrição |
|-------|-----------|
| `slug` | Identificador único (ex: `starter`, `pro`) |
| `price` | Preço em BRL |
| `billing_cycle` | `monthly` ou `yearly` |
| `is_active` | Se o plano está disponível para novas assinaturas |
| `features` | JSON com limites e flags (ex: `max_professionals`, `integrations_access`) |

**Como consultar planos ativos:**
```php
Plan::where('is_active', true)->get(['id','name','slug','price','billing_cycle']);
```

---

## Ciclo de Vida da Assinatura

### Estados possíveis

```
trialing → active → canceled
trialing → overdue
active   → overdue → active (reativação)
active   → canceled
```

| Status | Acesso permitido? | Descrição |
|--------|------------------|-----------|
| `trialing` | Sim (enquanto trial_ends_at futuro) | Período de teste |
| `active` | Sim (enquanto ends_at futuro/null) | Assinatura paga e vigente |
| `overdue` | Não | Pagamento vencido / trial expirado |
| `canceled` | Sim até ends_at | Cancelado mas período ainda vigente |

`isActive()` retorna true para: trialing com trial futuro, active com ends_at futuro ou null, canceled com ends_at futuro.

### 1. Criação do Trial
- Status inicial: `trialing`
- `trial_ends_at` definido para data futura
- `starts_at`: null

### 2. Ativação (Trial → Pago)
`POST /assinatura/ativar` → `BillingController@activate`

1. Cria invoice com `meta.type = 'trial_conversion'`
2. Cria cliente no Asaas (ou busca existente)
3. Gera cobrança no Asaas com link de pagamento
4. Armazena `provider_invoice_id` e `provider_payment_link` na invoice
5. Evento `InvoiceGenerated` disparado
6. Aguarda webhook `PAYMENT_RECEIVED` do Asaas

**Regra:** só funciona se `status = 'trialing'` E plano for o mesmo. Para trocar de plano no trial, usar upgrade.

### 3. Upgrade
`POST /assinatura/upgrade` → `BillingController@upgrade`

1. Invoice com `meta.type = 'upgrade'`
2. No pagamento: `subscription.plan_id` atualizado
3. `trial_ends_at` zerado se vindo de trial
4. Evento `PlanUpgraded` com `mrr_delta`

**Permitido de:** trialing (plano diferente), active, overdue.

### 4. Renovação Automática
Comando `saas:billing-recurring` (diário)

- Busca assinaturas `active` com `ends_at <= agora + 5 dias`
- Cria invoice com `meta.type = 'renewal'` e `reference_period = MM/YYYY do próximo mês`
- **Idempotente:** verifica se já existe invoice para `(workspace_id, reference_period)` com status `pending` ou `paid` antes de criar

### 5. Vencimento → Overdue
Comando `saas:billing-dunning` (diário)

- Assinaturas `active` com `ends_at < now()` → `overdue`
- Assinaturas `trialing` com `trial_ends_at < now()` → `overdue`
- Registra evento em `workspace_subscription_events`

⚠️ **Risco:** sem deduplicação — pode criar eventos duplicados se rodado duas vezes no mesmo dia.

### 6. Cancelamento
`POST /assinatura/cancelar` → `BillingController@cancel`

- Define `status = 'canceled'`, `canceled_at = now()`
- Workspace mantém acesso até `ends_at`
- Evento `SubscriptionCanceled`

### 7. Reativação (Overdue → Active)
Via pagamento de invoice vencida (webhook `PAYMENT_RECEIVED`)

- `confirmPayment()` detecta `previous_status = 'overdue'`
- Atualiza `ends_at` para próximo período
- Evento `SubscriptionReactivated`

---

## Ciclo de Vida da Invoice

### Estados

```
pending → paid
pending → overdue
pending → canceled
```

| Status | Descrição |
|--------|-----------|
| `pending` | Gerada, aguardando pagamento |
| `paid` | Paga via webhook Asaas |
| `overdue` | Venceu sem pagamento |
| `canceled` | Cancelada via webhook `PAYMENT_DELETED` |

### Campos importantes

| Campo | Descrição |
|-------|-----------|
| `provider_invoice_id` | ID do pagamento no Asaas — chave de lookup nos webhooks |
| `provider_payment_link` | Link de pagamento para enviar ao cliente |
| `reference_period` | `MM/YYYY` — chave de idempotência das renovações |
| `meta.type` | `trial_conversion`, `renewal`, `upgrade` |

### Confirmar pagamento manualmente (emergência)
```php
php artisan tinker
$invoice = WorkspaceBillingInvoice::find($id);
app(WorkspaceBillingService::class)->confirmPayment($invoice);
```

---

## Dunning e Retenção

### DunningService — Lembretes de Invoice

Executado via `saas:retention-ops` (manual):

| Tipo | Gatilho |
|------|---------|
| `upcoming` | Invoice com `due_date = hoje + 3 dias` |
| `due_today` | Invoice com `due_date = hoje` |
| `overdue` | Invoice com `due_date < hoje` e status `overdue` |

Cada lembrete é registrado em `workspace_subscription_events` para evitar duplicatas.

### TrialConversionService — Alertas de Trial

Alertas enviados em: 7 dias, 3 dias e no dia de expiração do trial.

Registra evento `trial_ending_soon` com `meta.days_left`.

⚠️ **Bug conhecido:** `TrialConversionService` linha 65 instancia o evento com named arguments em vez de `CommercialEventPayload`. Pode causar erro ao executar `saas:retention-ops`.

---

## Webhooks do Billing SaaS

**Rota:** `POST /api/webhooks/saas-billing/asaas`  
**Auth:** header `asaas-access-token` == `ASAAS_SAAS_WEBHOOK_TOKEN`

| Evento Asaas | Handler | Efeito |
|--------------|---------|--------|
| `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` | `confirmPayment()` | Invoice → paid, subscription atualizada |
| `PAYMENT_OVERDUE` | `handleOverdue()` | Invoice → overdue, subscription → overdue |
| `PAYMENT_DELETED` | `handleCancellation()` | Invoice → canceled |

**Lookup:** `WorkspaceBillingInvoice WHERE provider_invoice_id = payload.payment.id`

**Race condition:** `confirmPayment()` usa `lockForUpdate()` + verificação de idempotência (`invoice.status == 'paid'` → retorna sem reprocessar).

---

## Notificações Comerciais (SendCommercialNotification)

O listener `SendCommercialNotification` envia mensagem via `MessagingServiceInterface` para os seguintes eventos:

| Evento | Mensagem enviada |
|--------|-----------------|
| `SubscriptionActivated` | Boas-vindas à assinatura |
| `InvoiceGenerated` | Link de nova fatura gerada |
| `InvoicePaid` | Confirmação de pagamento recebido |
| `InvoiceOverdue` | Alerta de fatura vencida |
| `InvoiceReminderSent` | Lembrete de vencimento (dunning) |
| `TrialEndingSoon` | ✅ **(adicionado Sprint T4)** — alerta de trial expirando em N dias ou hoje |

### TrialEndingSoon — comportamento

- **meta.days_left = 7 ou 3**: mensagem padrão informando quantos dias restam
- **meta.days_left = 0**: mensagem urgente indicando que o trial termina hoje
- Disparado por: `TrialConversionService::processTrialAlerts()`

---

## Eventos Comerciais

Todos os eventos estendem `CommercialEvent` e são persistidos em `workspace_subscription_events` via listener `LogCommercialEvent`.

| Evento | Slug | Quando |
|--------|------|--------|
| `SubscriptionActivated` | `subscription_activated` | Primeiro pagamento (trial → pago) |
| `SubscriptionRenewed` | `subscription_renewed` | Pagamento recorrente de assinatura ativa |
| `SubscriptionReactivated` | `subscription_reactivated` | Pagamento saindo de `overdue` |
| `SubscriptionCanceled` | `subscription_canceled` | Cancelamento pelo usuário |
| `PlanUpgraded` | `plan_upgraded` | Upgrade de plano concluído |
| `InvoiceGenerated` | `invoice_generated` | Invoice criada no Asaas |
| `InvoicePaid` | `invoice_paid` | Pagamento confirmado |
| `InvoiceOverdue` | `invoice_overdue` | Invoice vencida |
| `InvoiceReminderSent` | `invoice_reminder_sent` | Lembrete de dunning enviado |
| `TrialEndingSoon` | `trial_ending_soon` | Trial expirando |
| `CancellationReasonRecorded` | `cancellation_reason_recorded` | Admin registrou motivo de churn |

**Payload base (CommercialEventPayload):**
```php
workspaceId, subscriptionId, invoiceId, planId, previousPlanId,
amount, previousAmount, deltaAmount, actorId, meta (array), occurredAt
```

Eventos disparam **após commit da transação** (`DB::afterCommit()`) — nunca antes.

---

## Integração com Asaas (`AsaasSaasProvider`)

### Configuração
```env
ASAAS_API_KEY=sk_...
ASAAS_API_URL=https://sandbox.asaas.com/api/v3   # Prod: https://api.asaas.com/v3
ASAAS_SAAS_WEBHOOK_TOKEN=token_para_webhook_saas
```

### O que o provider faz

**`getOrCreateCustomer(BillingWorkspaceDTO)`**
- Cria ou busca cliente no Asaas por `externalReference = workspace.id`
- Email fallback: `admin@{slug}.com` se workspace não tiver email

**`createPayment(customerId, amount, dueDate, description, externalReference)`**
- `externalReference` = ID da invoice local (permite lookup no webhook)
- `billingType = 'UNDEFINED'` (aceita Pix, cartão, boleto)
- Retorna `AsaasPaymentDTO` com `id`, `invoiceUrl`, `status`, `dueDate`, `amount`

---

## Controle de Features por Plano

`SubscriptionService` controla o acesso a features baseado no `plan.features` JSON.

```php
$sub = app(SubscriptionService::class);

$sub->canUseFeature($workspace, 'has_crm');           // bool
$sub->getLimit($workspace, 'max_professionals', 1);   // int
$sub->canAddResource($workspace, 'max_customers', $count); // bool
$sub->canAccessIntegration($workspace, 'evolution');  // bool
```

Todos retornam `false`/default se assinatura inativa ou inexistente.

---

## Rotas Disponíveis

| Rota | Método | Controller | Descrição |
|------|--------|------------|-----------|
| `/assinatura` | GET | `BillingController@index` | Visualizar assinatura e invoices |
| `/assinatura/ativar` | POST | `BillingController@activate` | Converter trial em pago |
| `/assinatura/upgrade` | POST | `BillingController@upgrade` | Trocar de plano |
| `/assinatura/cancelar` | POST | `BillingController@cancel` | Cancelar assinatura |

Requerem autenticação e gate `manage-settings`.

---

## Como Investigar Problemas

### Assinatura não ativou após pagamento
```sql
-- Verificar se invoice existe com provider_invoice_id correto
SELECT id, status, provider_invoice_id, paid_at
FROM workspace_billing_invoices
WHERE workspace_id = X
ORDER BY created_at DESC LIMIT 5;

-- Verificar eventos da assinatura
SELECT event_type, payload, created_at
FROM workspace_subscription_events
WHERE workspace_id = X
ORDER BY created_at DESC LIMIT 20;
```

Checar se `provider_invoice_id` bate com o ID do Asaas — se não bater, o webhook não vai encontrar a invoice.

### Invoice duplicada no mesmo período
```sql
SELECT reference_period, COUNT(*) 
FROM workspace_billing_invoices 
WHERE workspace_id = X 
GROUP BY reference_period 
HAVING COUNT(*) > 1;
```

### Workspace em `overdue` mas pagamento foi feito
1. Verificar se webhook chegou: checar `webhook_audits WHERE provider = 'asaas'`
2. Verificar se `provider_invoice_id` na invoice local bate com o Asaas
3. Verificar logs de erro no `SaasBillingWebhookController`
4. Forçar confirmação via Tinker se necessário

### Recriar invoice manualmente (emergência)
```php
php artisan tinker
$subscription = WorkspaceSubscription::where('workspace_id', X)->first();
$invoice = app(WorkspaceBillingService::class)->createInvoice($subscription, 'renewal');
echo $invoice->provider_payment_link;
```

### Verificar status atual do workspace
```php
$ws = Workspace::with(['subscription.plan'])->find($id);
echo $ws->subscription->status;       // trialing|active|overdue|canceled
echo $ws->subscription->ends_at;      // data de expiração
echo $ws->subscription->plan->slug;   // plano atual
```

### Comandos de billing para rodar manualmente
```bash
php artisan saas:billing-recurring    # gerar invoices de renovação
php artisan saas:billing-dunning      # marcar assinaturas vencidas
php artisan saas:retention-ops        # enviar lembretes de dunning
```
