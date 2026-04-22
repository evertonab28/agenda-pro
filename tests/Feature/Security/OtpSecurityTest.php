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
}
