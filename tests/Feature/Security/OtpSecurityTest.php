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

    public function test_brute_force_blocked_on_third_attempt(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);

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

        // Tentativa 3 — 429 pelo mecanismo de attempts, token deletado
        $this->postJson(route('portal.auth.verify-token', $this->workspaceA->slug), $payload)
            ->assertStatus(429)
            ->assertJson(['message' => 'Limite de tentativas excedido. Solicite um novo código.']);

        // Token deletado — prova que foi o mecanismo de attempts (não throttle)
        $this->assertEquals(0, CustomerAuthToken::where('customer_id', $this->customerA->id)->count());

        // Sem sessão autenticada
        $this->assertFalse(Auth::guard('customer')->check());
    }

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
}
