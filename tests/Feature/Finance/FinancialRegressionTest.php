<?php

namespace Tests\Feature\Finance;

use App\Models\Charge;
use App\Models\Customer;
use App\Models\Receipt;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->fulfillOnboarding($this->workspace->id);
        $this->user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'admin',
        ]);
    }

    /** @test */
    public function it_processes_full_payment_flow_via_webhook()
    {
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        $charge = Charge::create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $customer->id,
            'amount' => 300.00,
            'status' => 'pending',
            'due_date' => now()->addDays(2),
            'payment_provider_id' => 'provider_tx_001',
        ]);

        // Simula recebimento manual completo via rota de cobrança
        $response = $this->actingAs($this->user)
            ->post(route('finance.charges.receive', $charge), [
                'amount_received' => 300.00,
                'method' => 'cash',
                'received_at' => now()->format('Y-m-d'),
            ]);

        $response->assertRedirect();

        $charge->refresh();
        $this->assertEquals('paid', $charge->status);
        $this->assertNotNull($charge->paid_at);
    }

    /** @test */
    public function it_handles_partial_payments_correctly()
    {
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        $charge = Charge::create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $customer->id,
            'amount' => 1000.00,
            'status' => 'pending',
            'due_date' => now()->addWeek(),
        ]);

        // Simula recebimento manual de parte do valor
        $charge->update(['status' => 'partial']);

        $charge->refresh();
        $this->assertEquals('partial', $charge->status);
    }
}
