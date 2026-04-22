# OTP Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar o log de OTP em plaintext, corrigir inconsistência no limite de tentativas e criar cobertura de testes para os 5 cenários de segurança críticos do fluxo OTP.

**Architecture:** Patch cirúrgico em 2 arquivos de produção + 1 arquivo de testes novo. Nenhuma nova camada de abstração. Testes escritos antes das correções de produção para confirmar o comportamento atual antes de alterá-lo.

**Tech Stack:** PHP 8.2, Laravel 11, PHPUnit 11, Eloquent ORM, factories Laravel

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `app/Models/CustomerAuthToken.php` | Modificar | Corrigir `isValid()`: `attempts < 5` → `attempts < 3` |
| `app/Http/Controllers/Api/CustomerAuthController.php` | Modificar | Substituir `Log::info("MAGIC LINK OTP ... {$token}")` por log de metadados sem valor do token |
| `tests/Feature/Security/OtpSecurityTest.php` | Criar | 5 cenários de segurança OTP |

---

## Task 1: Criar o arquivo de testes com setup base

**Files:**
- Create: `tests/Feature/Security/OtpSecurityTest.php`

- [ ] **Step 1: Criar o arquivo com a classe base, imports e setUp**

```php
<?php

namespace Tests\Feature\Security;

use App\Models\Customer;
use App\Models\CustomerAuthToken;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class OtpSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspaceA;
    protected Workspace $workspaceB;
    protected Customer $customerA;
    protected Customer $customerB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspaceA = Workspace::factory()->create(['slug' => 'workspace-a']);
        $this->workspaceB = Workspace::factory()->create(['slug' => 'workspace-b']);

        $this->customerA = Customer::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'phone' => '11999990001',
            'email' => 'customer-a@example.com',
        ]);

        $this->customerB = Customer::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'phone' => '11999990002',
            'email' => 'customer-b@example.com',
        ]);
    }
}
```

- [ ] **Step 2: Confirmar que o arquivo é reconhecido pelo PHPUnit (sem testes ainda)**

```bash
cd d:/saas/agenda-pro && php artisan test --filter OtpSecurityTest 2>&1
```

Saída esperada: `No tests found` ou `Tests: 0` — sem erros de parse.

- [ ] **Step 3: Commit do scaffold**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Security/OtpSecurityTest.php && git commit -m "test(security): scaffold OtpSecurityTest com setup base"
```

---

## Task 2: Cenário 1 — OTP expirado é rejeitado

**Files:**
- Modify: `tests/Feature/Security/OtpSecurityTest.php`

- [ ] **Step 1: Adicionar o teste**

Adicionar dentro da classe `OtpSecurityTest`, após o `setUp`:

```php
public function test_expired_otp_is_rejected(): void
{
    CustomerAuthToken::create([
        'customer_id' => $this->customerA->id,
        'token' => '123456',
        'expires_at' => now()->subMinutes(1),
        'attempts' => 0,
    ]);

    $response = $this->postJson(
        route('portal.auth.verify-token', $this->workspaceA->slug),
        [
            'identifier' => $this->customerA->phone,
            'token' => '123456',
        ]
    );

    $response->assertStatus(401);
    $this->assertFalse(Auth::guard('customer')->check());
}
```

- [ ] **Step 2: Rodar o teste e confirmar que falha ou passa**

```bash
cd d:/saas/agenda-pro && php artisan test --filter test_expired_otp_is_rejected 2>&1
```

Saída esperada: PASS — o comportamento de rejeição de OTP expirado já está implementado no controller. Se falhar, há regressão a investigar antes de continuar.

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Security/OtpSecurityTest.php && git commit -m "test(security): OTP expirado é rejeitado com 401"
```

---

## Task 3: Cenário 2 — Reenvio invalida token anterior

**Files:**
- Modify: `tests/Feature/Security/OtpSecurityTest.php`

- [ ] **Step 1: Adicionar o teste**

```php
public function test_resend_invalidates_previous_token(): void
{
    // Primeiro envio — T1 criado
    $this->postJson(
        route('portal.auth.send-token', $this->workspaceA->slug),
        ['identifier' => $this->customerA->phone]
    )->assertStatus(200);

    $t1Value = CustomerAuthToken::where('customer_id', $this->customerA->id)
        ->latest()
        ->value('token');

    $this->assertNotNull($t1Value);

    // Segundo envio — T2 criado, T1 deve ter sido deletado
    $this->postJson(
        route('portal.auth.send-token', $this->workspaceA->slug),
        ['identifier' => $this->customerA->phone]
    )->assertStatus(200);

    // Deve existir exatamente 1 token (T2)
    $this->assertEquals(1, CustomerAuthToken::where('customer_id', $this->customerA->id)->count());

    // Tentar usar T1 deve falhar
    $response = $this->postJson(
        route('portal.auth.verify-token', $this->workspaceA->slug),
        [
            'identifier' => $this->customerA->phone,
            'token' => $t1Value,
        ]
    );

    $response->assertStatus(401);
    $this->assertFalse(Auth::guard('customer')->check());
}
```

- [ ] **Step 2: Rodar o teste**

```bash
cd d:/saas/agenda-pro && php artisan test --filter test_resend_invalidates_previous_token 2>&1
```

Saída esperada: PASS — `sendToken` já executa `CustomerAuthToken::where('customer_id', $customer->id)->delete()` antes de criar o novo.

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Security/OtpSecurityTest.php && git commit -m "test(security): reenvio de OTP invalida token anterior"
```

---

## Task 4: Cenário 3 — Brute force bloqueado na 3ª tentativa

**Files:**
- Modify: `tests/Feature/Security/OtpSecurityTest.php`

- [ ] **Step 1: Adicionar o teste**

```php
public function test_brute_force_blocked_on_third_attempt(): void
{
    CustomerAuthToken::create([
        'customer_id' => $this->customerA->id,
        'token' => '999999',
        'expires_at' => now()->addMinutes(15),
        'attempts' => 0,
    ]);

    $payload = [
        'identifier' => $this->customerA->phone,
        'token' => '000000', // token errado
    ];

    // Tentativa 1 — 401
    $this->postJson(route('portal.auth.verify-token', $this->workspaceA->slug), $payload)
        ->assertStatus(401)
        ->assertJson(['message' => 'Código incorreto']);

    // Tentativa 2 — 401
    $this->postJson(route('portal.auth.verify-token', $this->workspaceA->slug), $payload)
        ->assertStatus(401)
        ->assertJson(['message' => 'Código incorreto']);

    // Tentativa 3 — 429, token deletado
    $this->postJson(route('portal.auth.verify-token', $this->workspaceA->slug), $payload)
        ->assertStatus(429)
        ->assertJson(['message' => 'Limite de tentativas excedido. Solicite um novo código.']);

    // Token deve ter sido deletado
    $this->assertEquals(0, CustomerAuthToken::where('customer_id', $this->customerA->id)->count());

    // Sem sessão autenticada
    $this->assertFalse(Auth::guard('customer')->check());
}
```

- [ ] **Step 2: Rodar o teste**

```bash
cd d:/saas/agenda-pro && php artisan test --filter test_brute_force_blocked_on_third_attempt 2>&1
```

Saída esperada: PASS — comportamento já implementado no controller. Se falhar com status inesperado, verificar se o throttle de rota está interferindo no ambiente de teste.

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Security/OtpSecurityTest.php && git commit -m "test(security): brute force bloqueado na 3ª tentativa com 429"
```

---

## Task 5: Cenário 4 — sendToken cross-tenant não cria token para customer de outro workspace

**Files:**
- Modify: `tests/Feature/Security/OtpSecurityTest.php`

- [ ] **Step 1: Adicionar o teste**

```php
public function test_send_token_does_not_create_token_for_customer_of_another_workspace(): void
{
    // customerB pertence ao workspaceB — usar seu phone no workspaceA
    $response = $this->postJson(
        route('portal.auth.send-token', $this->workspaceA->slug),
        ['identifier' => $this->customerB->phone]
    );

    // Workspace A não conhece esse identifier — trata como novo usuário
    $response->assertStatus(200);
    $response->assertJson(['requires_name' => true]);

    // Nenhum token foi criado para customerB
    $this->assertEquals(
        0,
        CustomerAuthToken::where('customer_id', $this->customerB->id)->count()
    );

    // Nenhuma sessão foi iniciada
    $this->assertFalse(Auth::guard('customer')->check());
}
```

- [ ] **Step 2: Rodar o teste**

```bash
cd d:/saas/agenda-pro && php artisan test --filter test_send_token_does_not_create_token_for_customer_of_another_workspace 2>&1
```

Saída esperada: PASS — `sendToken` filtra por `workspace_id` na busca de customer. O identifier de outro workspace retorna null, resultando em `requires_name: true`.

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Security/OtpSecurityTest.php && git commit -m "test(security): sendToken cross-tenant não cria token para customer de outro workspace"
```

---

## Task 6: Cenário 5 — verifyToken cross-tenant sem efeito colateral

**Files:**
- Modify: `tests/Feature/Security/OtpSecurityTest.php`

- [ ] **Step 1: Adicionar o teste**

```php
public function test_verify_token_cross_tenant_has_no_side_effects(): void
{
    // Criar token válido para customerB no workspaceB
    $tokenB = CustomerAuthToken::create([
        'customer_id' => $this->customerB->id,
        'token' => '777777',
        'expires_at' => now()->addMinutes(15),
        'attempts' => 0,
    ]);

    // Tentar verificar usando workspaceA com identifier e token do customerB
    $response = $this->postJson(
        route('portal.auth.verify-token', $this->workspaceA->slug),
        [
            'identifier' => $this->customerB->phone,
            'token' => '777777',
        ]
    );

    // Deve retornar 401 — workspaceA não conhece esse identifier
    $response->assertStatus(401);

    // Nenhuma sessão foi iniciada
    $this->assertFalse(Auth::guard('customer')->check());

    // O token de customerB permanece intacto — attempts não foi incrementado
    $tokenB->refresh();
    $this->assertEquals(0, $tokenB->attempts);

    // O token não foi deletado
    $this->assertDatabaseHas('customer_auth_tokens', ['id' => $tokenB->id]);
}
```

- [ ] **Step 2: Rodar o teste**

```bash
cd d:/saas/agenda-pro && php artisan test --filter test_verify_token_cross_tenant_has_no_side_effects 2>&1
```

Saída esperada: PASS — `verifyToken` busca o customer por `workspace_id` primeiro; se não encontrar, retorna 401 antes de tocar em qualquer token.

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Security/OtpSecurityTest.php && git commit -m "test(security): verifyToken cross-tenant não incrementa attempts nem deleta token da vítima"
```

---

## Task 7: Rodar todos os 5 testes juntos

**Files:**
- No changes — apenas validação

- [ ] **Step 1: Rodar toda a classe**

```bash
cd d:/saas/agenda-pro && php artisan test --filter OtpSecurityTest 2>&1
```

Saída esperada:
```
Tests:    5 passed
```

Se algum falhar, investigar antes de prosseguir. Não avançar para Task 8 com testes vermelhos.

---

## Task 8: Corrigir `CustomerAuthToken::isValid()`

**Files:**
- Modify: `app/Models/CustomerAuthToken.php:33`

- [ ] **Step 1: Alterar `isValid()`**

Abrir `app/Models/CustomerAuthToken.php`. Localizar:

```php
public function isValid(): bool
{
    return !$this->isExpired() && $this->attempts < 5;
}
```

Substituir por:

```php
public function isValid(): bool
{
    return !$this->isExpired() && $this->attempts < 3;
}
```

- [ ] **Step 2: Rodar a suite completa de segurança para confirmar sem regressões**

```bash
cd d:/saas/agenda-pro && php artisan test tests/Feature/Security/ 2>&1
```

Saída esperada: todos os testes do diretório `Security/` passando, incluindo `OtpSecurityTest`, `TenantIsolationTest` e `PublicFlowSecurityTest`.

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add app/Models/CustomerAuthToken.php && git commit -m "fix(security): alinhar isValid() para attempts < 3, consistente com controller"
```

---

## Task 9: Remover log de OTP em plaintext

**Files:**
- Modify: `app/Http/Controllers/Api/CustomerAuthController.php:71`

- [ ] **Step 1: Substituir a linha do log**

Abrir `app/Http/Controllers/Api/CustomerAuthController.php`. Localizar a linha 71:

```php
Log::info("MAGIC LINK OTP para {$customer->name} ({$workspace->slug}): {$token}");
```

Substituir por:

```php
Log::info('OTP gerado', ['customer_id' => $customer->id, 'workspace_slug' => $workspace->slug]);
```

- [ ] **Step 2: Confirmar que o import de `Log` já existe no topo do arquivo**

A linha `use Illuminate\Support\Facades\Log;` já existe (linha 11). Não precisa adicionar.

- [ ] **Step 3: Rodar a suite completa**

```bash
cd d:/saas/agenda-pro && php artisan test tests/Feature/Security/ 2>&1
```

Saída esperada: todos os testes passando.

- [ ] **Step 4: Confirmar que nenhum teste depende da string do log antigo**

```bash
cd d:/saas/agenda-pro && grep -r "MAGIC LINK" tests/ 2>&1
```

Saída esperada: nenhum resultado.

- [ ] **Step 5: Commit**

```bash
cd d:/saas/agenda-pro && git add app/Http/Controllers/Api/CustomerAuthController.php && git commit -m "fix(security): remover OTP plaintext do log — logar apenas customer_id e workspace_slug"
```

---

## Task 10: Validação final

**Files:**
- No changes — verificação completa

- [ ] **Step 1: Rodar a suite completa de testes**

```bash
cd d:/saas/agenda-pro && php artisan test 2>&1
```

Saída esperada: todos os testes existentes passando, sem regressões.

- [ ] **Step 2: Confirmar que o valor do OTP não aparece em nenhum log**

```bash
cd d:/saas/agenda-pro && grep -r "MAGIC LINK\|: \$token\|OTP para" app/ 2>&1
```

Saída esperada: nenhum resultado.

- [ ] **Step 3: Confirmar critérios de aceite**

Checar mentalmente cada item da seção "Critérios de aceite" do spec:

- `CustomerAuthController` não loga o valor do OTP — confirmado em Task 9
- Log contém apenas `customer_id` e `workspace_slug` — confirmado em Task 9
- `isValid()` retorna false quando `attempts >= 3` — confirmado em Task 8
- OTP expirado rejeitado com 401 — coberto em Task 2
- Reenvio invalida anterior — coberto em Task 3
- 3ª tentativa errada retorna 429 e deleta token — coberto em Task 4
- sendToken cross-tenant não cria token para customer de outro workspace — coberto em Task 5
- verifyToken cross-tenant: 401, sem incrementar attempts, sem deletar token — coberto em Task 6
- 5 cenários passam com `--filter OtpSecurityTest` — confirmado em Task 7

- [ ] **Step 4: Commit final de revisão (se necessário)**

Se não houve commits intermediários esquecidos:

```bash
cd d:/saas/agenda-pro && git status 2>&1
```

Saída esperada: `nothing to commit, working tree clean`.
