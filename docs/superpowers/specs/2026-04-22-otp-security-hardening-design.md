# OTP Security Hardening — Design Spec

**Data:** 2026-04-22  
**Sprint:** Segurança mínima e isolamento multi-tenant  
**Escopo:** Patch cirúrgico — sem refactor arquitetural

---

## Contexto

SaaS multi-tenant de agendamento. Clientes finais acessam o portal via OTP (6 dígitos) enviado por WhatsApp/Email (hoje mockado via log). Foi identificado que o valor do OTP estava sendo logado em plaintext, e que existe uma inconsistência entre o limite de tentativas declarado no model (`< 5`) e o aplicado no controller (`>= 3`).

---

## Problemas a corrigir

### 1. OTP logado em plaintext
`CustomerAuthController.php:71` loga o valor do token diretamente:
```
Log::info("MAGIC LINK OTP para {name} ({slug}): {token}")
```
Qualquer sistema de log agregado (Papertrail, Datadog, Sentry, etc.) ou acesso ao storage de logs expõe o token válido de qualquer cliente.

**Correção:** substituir por log de metadados seguros:
```php
Log::info('OTP gerado', ['customer_id' => $customer->id, 'workspace_slug' => $workspace->slug]);
```

### 2. Inconsistência no limite de tentativas
- `CustomerAuthToken::isValid()` usa `attempts < 5`
- `CustomerAuthController::verifyToken()` deleta o token em `attempts >= 3`

Os dois limites coexistem mas divergem: o model diz que o token é válido até 4 tentativas erradas, o controller o destrói na 3ª. O comportamento efetivo é controlado pelo controller (3 tentativas), mas `isValid()` retorna `true` para tokens que o controller já teria destruído — o que é semanticamente incorreto.

**Correção:** alinhar `isValid()` para `attempts < 3`.

---

## Números mágicos auditados no fluxo OTP

| Local | Valor | Papel | Status |
|-------|-------|-------|--------|
| `CustomerAuthController:62` | `random_int(0, 999999)` + `str_pad(..., 6)` | Gera token de 6 dígitos | OK |
| `CustomerAuthController:67` | `addMinutes(15)` | Expiração do token | OK |
| `CustomerAuthController:86` | `size:6` | Validação de formato | OK — consistente com geração |
| `CustomerAuthController:119` | `>= 3` | Deleta token na 3ª tentativa errada | OK |
| `CustomerAuthToken:33` | `< 5` | **Inconsistente** com controller | **Corrigir para `< 3`** |
| `routes/web.php:169` | `throttle:3,1` | 3 send-token por minuto por IP | OK |
| `routes/web.php:170` | `throttle:10,1` | 10 verify-token por minuto por IP | OK — complementar ao limite por token |
| `routes/web.php:176` | `throttle:5,1` | 5 bookings por minuto por IP | OK |

O throttle de `verify-token` (10/min por IP) e o limite de tentativas por token (3) são mecanismos complementares: o throttle protege contra flood de IPs, o limite protege contra brute force no token individual.

---

## Comportamento exato do fluxo de tentativas (conforme código)

1. Tentativa 1 errada: `attempts = 1`, retorna **401** "Código incorreto"
2. Tentativa 2 errada: `attempts = 2`, retorna **401** "Código incorreto"
3. Tentativa 3 errada: `attempts = 3`, token **deletado**, retorna **429** "Limite de tentativas excedido"
4. Qualquer tentativa após deleção: token não existe, retorna **401** "Código inválido ou expirado"

---

## Testes a criar

Arquivo novo: `tests/Feature/Security/OtpSecurityTest.php`

### Cenário 1 — OTP expirado é rejeitado
- Cria `CustomerAuthToken` com `expires_at` no passado
- Chama `verifyToken` com o token correto
- Espera **401**
- Confirma que o cliente não está autenticado

### Cenário 2 — Reenvio invalida token anterior
- Chama `sendToken` → token T1 criado
- Chama `sendToken` novamente → token T2 criado, T1 deletado
- Tenta `verifyToken` com valor de T1
- Espera **401**
- Confirma que não há sessão autenticada

### Cenário 3 — Brute force: 3 tentativas erradas
- Cria token válido
- Chama `verifyToken` com token errado 2 vezes → espera **401** em cada
- Chama `verifyToken` com token errado pela 3ª vez → espera **429**
- Confirma que o token foi deletado (`CustomerAuthToken::count() === 0`)
- Confirma que o cliente não está autenticado

### Cenário 4 — sendToken com identifier de outro workspace
- Customer C existe no workspace B com phone `X`
- Chama `sendToken` no workspace A com identifier `X`
- Espera resposta com `requires_name: true` (customer não encontrado no workspace A)
- Confirma que nenhum token foi criado para o customer B
- Confirma que nenhuma sessão foi iniciada

### Cenário 5 — verifyToken com customer de outro workspace
- Customer C existe no workspace B com token válido T (`attempts = 0`)
- Chama `verifyToken` no workspace A com identifier e token de C
- Espera **401**
- Confirma que `Auth::guard('customer')->check()` é falso — nenhuma sessão foi iniciada
- Confirma que `attempts` do token de C permanece em 0 — nenhum efeito colateral cross-tenant
- Confirma que o token de C não foi deletado — permanece intacto no banco

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `app/Http/Controllers/Api/CustomerAuthController.php` | Substituir log plaintext por log de metadados |
| `app/Models/CustomerAuthToken.php` | `isValid()`: `< 5` → `< 3` |
| `tests/Feature/Security/OtpSecurityTest.php` | Arquivo novo com 5 cenários |

---

## Riscos mitigados

- Log de OTP em plaintext eliminado
- Inconsistência semântica em `isValid()` corrigida
- Cobertura de teste para os 5 casos de segurança críticos do fluxo OTP

## Riscos que continuam (fora do escopo desta sprint)

- WhatsApp/Email de envio ainda é mock — o OTP é gerado mas não entregue ao usuário real; canal de entrega a implementar
- Throttle por IP pode ser contornado com rotação de IPs (mitigação mais avançada, fora do escopo)
- `withoutGlobalScopes()` em 40+ locais — revisão pendente para sprint futura

---

## Critérios de aceite

- `CustomerAuthController` não loga o valor do OTP em nenhuma condição
- O log de OTP contém apenas `customer_id` e `workspace_slug`
- `CustomerAuthToken::isValid()` retorna `false` quando `attempts >= 3`
- OTP expirado é rejeitado com 401 sem autenticar a sessão
- Reenvio de token torna o token anterior inválido (deleted)
- Terceira tentativa errada retorna 429 e deleta o token
- `sendToken` com identifier de outro workspace não cria token para customer desse workspace
- `verifyToken` com credentials de outro workspace retorna 401 sem autenticar, sem incrementar attempts, sem deletar o token da vítima
- Todos os 5 cenários de teste passam com `php artisan test --filter OtpSecurityTest`
