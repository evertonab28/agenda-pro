# Integrações por Workspace — Operação e Debug

Cada workspace gerencia suas próprias integrações de pagamento e mensageria. As credenciais são armazenadas encriptadas, isoladas por tenant.

---

## Tipos de Integração

| Tipo | Providers Suportados | Finalidade |
|------|---------------------|-----------|
| `payment` | `asaas`, `stripe`* | Geração de links de pagamento para cobranças |
| `messaging` | `evolution`, `whatsapp` | Envio de lembretes e confirmações via WhatsApp |

*Stripe declarado na validação mas sem implementação de serviço.

---

## Model: `WorkspaceIntegration`

Tabela: `workspace_integrations`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `workspace_id` | FK | Isolamento por tenant |
| `type` | string | `payment` ou `messaging` |
| `provider` | string | `asaas`, `evolution`, etc. |
| `credentials` | encrypted array | Chaves/tokens sensíveis |
| `status` | string | `active`, `inactive`, `error` |
| `meta` | json nullable | Metadados extras (webhook secrets, config) |
| `last_check_at` | timestamp nullable | Último health check |

Constraint única: `(workspace_id, type, provider)` — apenas uma integração por tipo/provider por workspace.

**Credenciais são decriptadas automaticamente ao acessar `$integration->credentials`.**

---

## Asaas — Integração de Pagamento

### Credenciais necessárias
```json
{
  "api_key": "sk_..."
}
```

### Variáveis de ambiente
```env
ASAAS_API_URL=https://sandbox.asaas.com/api/v3  # Prod: https://api.asaas.com/v3
ASAAS_API_KEY=sk_...
ASAAS_SAAS_WEBHOOK_TOKEN=token_para_webhook_saas
```

### O que o serviço faz (`AsaasPaymentService`)
1. Cria/busca cliente no Asaas baseado no `Customer` da cobrança
2. Gera cobrança via `/payments` na API do Asaas
3. Armazena no modelo `Charge`: `payment_link_hash`, `payment_provider_id`, `payment_link_expires_at`, `notes` (invoiceUrl)
4. Em webhook de retorno: atualiza `Charge.status = 'paid'`

### Como gerar link de pagamento manualmente
```bash
POST /api/workspace-integrations/{charge_id}/generate-link
```
- Se já existe `payment_link_hash` + `payment_provider_id` → retorna link existente
- Caso contrário → gera novo via Asaas

### Como testar conexão
```bash
POST /api/workspace-integrations/{id}/test-connection
```
Resposta de sucesso: `{"ok": true}` — atualiza `status = 'active'` e `last_check_at`  
Resposta de falha: HTTP 400 `{"ok": false, "message": "..."}`  — atualiza `status = 'error'`

---

## Evolution API — WhatsApp

### Credenciais necessárias
```json
{
  "api_key": "token_evolution",
  "instance_name": "nome_instancia",
  "base_url": "http://evolution-api:8080"  // opcional
}
```

### Variáveis de ambiente
```env
EVOLUTION_API_URL=http://evolution-api:8080
MESSAGING_WEBHOOK_SECRET=secret_para_validar_webhooks
```

### O que o serviço faz (`EvolutionWhatsAppService`)
1. Normaliza número de telefone para formato E.164 (Brasil: adiciona código 55)
2. Envia via `POST /message/sendText/{instanceName}`
3. Adiciona `delay: 1200ms` + `presence: composing` para parecer humano
4. Retorna `{ok: true/false, id: messageId, status: 'sent'/'error'}`

### Mapeamento de erros HTTP da Evolution
| HTTP | Mensagem Retornada |
|------|--------------------|
| 401/403 | "Autenticação Inválida/Não Autorizado" |
| 422 | "Número Inválido (422)" |
| 5xx | "Indisponibilidade do Provedor (500)" |
| Outros | "Erro de Comunicação" |

---

## API de Gerenciamento de Integrações

### Listar integrações do workspace
```
GET /api/workspace-integrations
```
Retorna: `id, type, provider, status, last_check_at` — **credenciais não são expostas**.

### Criar/atualizar integração
```
POST /api/workspace-integrations
{
  "type": "messaging",
  "provider": "evolution",
  "credentials": {
    "api_key": "...",
    "instance_name": "..."
  }
}
```
Usa `updateOrCreate` — atualiza se já existe a combinação `(workspace_id, type, provider)`.

### Visualizar na UI (Settings)
`GET /configurações/integrações` — Interface Inertia com credenciais mascaradas como `"********"`.

---

## Factory de Resolução

`IntegrationProviderFactory::payment($workspace)` → resolve `AsaasPaymentService`  
`IntegrationProviderFactory::messaging($workspace)` → resolve `EvolutionWhatsAppService`

Ambos filtram por `status = 'active'`. Se não houver integração ativa configurada, lançam exceção.

---

## Webhook de Mensageria (Inbound)

Recebe mensagens do Evolution/WhatsApp quando cliente responde.

**Rota:** `POST /webhooks/{workspace:slug}/{provider}/messaging`

### Validação de assinatura
- HMAC-SHA256: `hash_hmac('sha256', timestamp . '.' . payload, secret)`
- Fallback: comparação direta de token no header
- Proteção anti-replay: janela de 5 minutos no timestamp
- Bloqueia em produção se `MESSAGING_WEBHOOK_SECRET` não estiver configurado

### Processamento
| Mensagem contém | Ação |
|-----------------|------|
| "CONFIRMAR" | Appointment → `confirmed` |
| "REAGENDAR" | Appointment → `canceled` (sinal de reagendamento) |
| Outros | Ignorado (retorna 200) |

- Idempotência via `WebhookAudit` (não processa o mesmo `event_id` duas vezes)

---

## Problemas Comuns

| Problema | Causa Provável | Como Resolver |
|----------|---------------|---------------|
| "Nenhuma integração de pagamento configurada" | Sem integração ativa de payment | Criar via `POST /api/workspace-integrations` com `status='active'` |
| "Credenciais incompletas" (Evolution) | `api_key` ou `instance_name` ausente | Verificar e recriar a integração com credenciais completas |
| Webhook retorna 401 "Assinatura inválida" | HMAC diverge ou relógios dessincronizados | Sincronizar NTP, verificar `MESSAGING_WEBHOOK_SECRET` |
| Webhook retorna 500 "Secret não configurado" | `MESSAGING_WEBHOOK_SECRET` vazio | Configurar a variável de ambiente |
| PAYMENT_CONFIRMED não processa | `provider_invoice_id` não bate | Verificar `WorkspaceBillingInvoice.provider_invoice_id` vs ID do Asaas |
| "Número Inválido (422)" | Telefone fora do formato esperado | Enviar número apenas com dígitos, sem formatação especial |

---

## Como Investigar

### 1. Verificar status das integrações de um workspace
```php
php artisan tinker
WorkspaceIntegration::where('workspace_id', $workspaceId)->get(['id','type','provider','status','last_check_at']);
```

### 2. Ver credenciais armazenadas (já decriptadas)
```php
$integration = WorkspaceIntegration::find($id);
dd($integration->credentials); // decripta automaticamente
```

### 3. Verificar logs de integração
```bash
tail -f storage/logs/laravel-$(date +%Y-%m-%d).log | grep -iE "integration|evolution|asaas|webhook"
```

### 4. Verificar auditoria de webhooks recebidos
```php
WebhookAudit::where('workspace_id', $workspaceId)->orderByDesc('created_at')->limit(20)->get();
```

### 5. Forçar recheck de conexão via Tinker
```php
$integration = WorkspaceIntegration::find($id);
$service = IntegrationProviderFactory::messaging($integration->workspace);
// Se não lançar exceção, credenciais foram carregadas. Para testar envio:
$service->send('5511999999999', 'Teste');
```
