# Webhooks — Operação, Segurança e Troubleshooting

---

## Endpoints Disponíveis

| Rota | Provider | Finalidade |
|------|---------|-----------|
| `POST /api/webhooks/{workspace:slug}/{provider}/payment` | Asaas | Confirmação de cobranças de clientes |
| `POST /api/webhooks/{workspace:slug}/{provider}/messaging` | Evolution / WhatsApp | Confirmação de agendamentos via mensagem |
| `POST /api/webhooks/saas-billing/asaas` | Asaas | Pagamento de invoices SaaS (assinatura) |

Throttle: `20 req/min` nos dois primeiros. SaaS billing: sem throttle.

---

## Segurança — Validação de Assinatura

### Método padrão: HMAC-SHA256

```
signature = HMAC-SHA256(timestamp + "." + raw_body, secret)
```

**Headers esperados:**
- `X-Webhook-Signature` (ou `asaas-signature`): valor da assinatura
- `X-Webhook-Timestamp`: Unix timestamp do envio

**Proteção anti-replay:** janela de 5 minutos. Timestamps fora da janela → HTTP 401.

**Fallback para token estático:** se HMAC falhar, compara assinatura diretamente com o secret (providers que usam token simples).

### Exceção: Evolution API
O provider `evolution` **não valida assinatura**. A chamada é aceita sem verificação de HMAC.

### Por onde fica o secret?

| Webhook | Onde está o secret |
|---------|------------------|
| Payment (por workspace) | `WorkspaceIntegration.meta['webhook_secret']` |
| Messaging (por workspace) | `WorkspaceIntegration.meta['webhook_secret']` → fallback `MESSAGING_WEBHOOK_SECRET` |
| SaaS Billing | Header `asaas-access-token` vs `config('services.payment.asaas.webhook_token')` |

**Em produção**, se `MESSAGING_WEBHOOK_SECRET` não estiver configurado e provider ≠ evolution → HTTP 500 (fail-safe intencional).

---

## Idempotência — `webhook_audits`

Todos os webhooks verificam duplicata antes de processar.

**Fluxo:**
1. Extrai `event_id` do payload (`data['event_id']` → fallback `data['id']`)
2. Consulta `webhook_audits WHERE provider = ? AND event_id = ?`
3. Se encontrado: retorna `200 {"action": "already_processed"}` sem processar
4. Se não encontrado: processa e insere registro na tabela

**Tabela `webhook_audits`:**
| Campo | Descrição |
|-------|-----------|
| `provider` | `asaas`, `evolution`, `whatsapp` |
| `event_id` | ID único vindo do payload |
| `processed_at` | Timestamp do processamento |
| Unique | `(provider, event_id)` |

Registros são deletados após 90 dias pelo comando `db:purge-security-logs`.

---

## Webhook de Pagamento (Customer Charges)

**Rota:** `POST /api/webhooks/{workspace:slug}/asaas/payment`

### Eventos processados

| Evento Asaas | Ação |
|--------------|------|
| `PAYMENT_RECEIVED` | Atualiza `Charge.status = 'paid'`, `paid_at = now()` |
| `PAYMENT_CONFIRMED` | Idem |
| Outros | Registra na auditoria e ignora (`action: 'ignored'`) |

**Lookup:** `Charge WHERE payment_provider_id = payload.id`

### Respostas possíveis

| HTTP | Corpo | Motivo |
|------|-------|--------|
| 200 | `{action: 'payment_recorded'}` | Sucesso |
| 200 | `{action: 'already_processed'}` | Duplicata |
| 200 | `{action: 'ignored'}` | Evento não relevante |
| 401 | `Unauthorized signature` | HMAC inválido |
| 404 | `Cobrança não encontrada` | `payment_provider_id` não encontrado |
| 422 | `event_id ausente` | Payload sem identificador |

---

## Webhook de Mensageria (Confirmações via WhatsApp)

**Rota:** `POST /api/webhooks/{workspace:slug}/{provider}/messaging`

### Eventos processados

| Texto da mensagem | Ação |
|------------------|------|
| Contém `"CONFIRMAR"` | `Appointment.status = 'confirmed'`, `confirmed_at = now()` |
| Contém `"REAGENDAR"` | `Appointment.status = 'canceled'` (sinal de reagendamento) |
| Outros | Ignorado (`action: 'ignored'`) |

**Lookup:** `Appointment WHERE public_token = payload.appointment_token` (ou `payload.token`)

---

## Webhook SaaS Billing (Assinaturas)

**Rota:** `POST /api/webhooks/saas-billing/asaas`  
**Autenticação:** Header `asaas-access-token` comparado com `ASAAS_SAAS_WEBHOOK_TOKEN`

### Eventos processados

| Evento Asaas | Ação |
|--------------|------|
| `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` | `WorkspaceBillingService::confirmPayment()` |
| `PAYMENT_OVERDUE` | `WorkspaceBillingService::handleOverdue()` |
| `PAYMENT_DELETED` | `WorkspaceBillingService::handleCancellation()` |

**Lookup:** `WorkspaceBillingInvoice WHERE provider_invoice_id = payload.payment.id`

### Efeitos do `confirmPayment()`
1. Lock na invoice (prevenção de race condition)
2. `invoice.status = 'paid'`, `paid_at = now()`
3. Calcula próxima data de vencimento (mensal/anual)
4. Atualiza ou cria `WorkspaceSubscription`
5. Emite eventos comerciais (ver tabela abaixo)

### Eventos Comerciais Emitidos

| Evento | Quando |
|--------|--------|
| `InvoiceGenerated` | Ao criar invoice |
| `InvoicePaid` | Ao confirmar pagamento |
| `InvoiceOverdue` | Ao marcar invoice como vencida |
| `SubscriptionActivated` | Primeiro pagamento |
| `SubscriptionRenewed` | Pagamento recorrente |
| `SubscriptionReactivated` | Pagamento saindo de estado `overdue` |
| `PlanUpgraded` | Pagamento com mudança de plano |

Todos ficam em `workspace_subscription_events`.

---

## Variáveis de Ambiente

```env
ASAAS_API_KEY=sk_...
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_SAAS_WEBHOOK_TOKEN=token_saas_billing

MESSAGING_WEBHOOK_SECRET=secret_global_mensageria
EVOLUTION_API_URL=http://evolution-api:8080
```

---

## Como Testar Manualmente (cURL)

### Webhook de pagamento (customer charge)
```bash
TIMESTAMP=$(date +%s)
PAYLOAD='{"event_id":"test_123","id":"asaas_payment_abc","status":"paid"}'
SECRET="seu_webhook_secret"
SIGNATURE=$(echo -n "$TIMESTAMP.$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:8000/api/webhooks/meuworkspace/asaas/payment \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -H "X-Webhook-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD"
```

### Webhook de mensageria (confirmação)
```bash
TIMESTAMP=$(date +%s)
PAYLOAD='{"event_id":"msg_456","appointment_token":"TOKEN_DO_AGENDAMENTO","text":"CONFIRMAR"}'
SECRET="seu_messaging_secret"
SIGNATURE=$(echo -n "$TIMESTAMP.$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:8000/api/webhooks/meuworkspace/evolution/messaging \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -H "X-Webhook-Timestamp: $TIMESTAMP" \
  -d "$PAYLOAD"
```

### Webhook SaaS billing
```bash
curl -X POST http://localhost:8000/api/webhooks/saas-billing/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: SEU_TOKEN" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"asaas_inv_123","status":"paid"}}'
```

---

## Troubleshooting

### Webhook não está sendo processado

**1. Verificar se a rota está acessível:**
```bash
curl -X OPTIONS http://localhost:8000/api/webhooks/slug/asaas/payment -v
```

**2. Verificar se já foi processado (idempotência):**
```sql
SELECT * FROM webhook_audits WHERE provider = 'asaas' AND event_id = 'SEU_EVENT_ID';
```
Se existir, foi processado. Para reprocessar:
```sql
DELETE FROM webhook_audits WHERE provider = 'asaas' AND event_id = 'SEU_EVENT_ID';
```

**3. Verificar se o recurso foi encontrado:**

Pagamento de cobrança:
```sql
SELECT * FROM charges WHERE payment_provider_id = 'ID_DO_ASAAS';
```

Agendamento via mensagem:
```sql
SELECT * FROM appointments WHERE public_token = 'TOKEN';
```

Invoice SaaS:
```sql
SELECT * FROM workspace_billing_invoices WHERE provider_invoice_id = 'ID_ASAAS';
```

### Assinatura inválida (HTTP 401)

Debug da assinatura:
```php
php artisan tinker
$payload = '{"event_id":"test"}';
$timestamp = time();
$secret = WorkspaceIntegration::find($id)->meta['webhook_secret'];
$sig = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
echo $sig;
```

Causas comuns:
- Secret diferente do configurado no provider
- Payload sendo parseado antes de assinar (deve usar body raw)
- Relógio do servidor dessincronizado → timestamp fora da janela de 5 min

### Timestamp expirado (HTTP 401 "Request expirado")

Webhook enviado há mais de 5 minutos. Causas:
- Provider tentando reenviar webhook antigo
- Relógio do servidor desincronizado com NTP

```bash
# Verificar horário do servidor
date
timedatectl status
```

### Rate limiting (HTTP 429)

Limite: 20 req/min. Se o provider reenviar com muita frequência, alguns serão bloqueados.  
Solução: ajustar configuração de retry no provider, ou aumentar o throttle em `routes/api.php`.

### PAYMENT_CONFIRMED chegou mas invoice não foi paga

1. Verificar se `provider_invoice_id` bate:
```sql
SELECT id, provider_invoice_id, status FROM workspace_billing_invoices 
WHERE workspace_id = X ORDER BY created_at DESC LIMIT 5;
```
2. Verificar logs para erros em `WorkspaceBillingService::confirmPayment()`
3. Verificar se já está marcada como paga (idempotência pode ter bloqueado reprocessamento)
