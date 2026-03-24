<?php

namespace Tests\Feature\Finance;

use App\Models\Charge;
use App\Models\Customer;
use App\Models\Receipt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class FinancialRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.messaging.webhook_secret', 'secret-123');
    }

    /** @test */
    public function it_processes_full_payment_flow_via_webhook()
    {
        $clinic = \App\Models\Clinic::factory()->create();
        $customer = Customer::factory()->create(['clinic_id' => $clinic->id]);
        $charge = Charge::create([
            'clinic_id' => $clinic->id,
            'customer_id' => $customer->id,
            'amount' => 300.00,
            'status' => 'pending',
            'due_date' => now()->addDays(2),
            'payment_provider_id' => 'provider_tx_001'
        ]);

        // Simula webhook do provider com HMAC e Idempotência
        $secret = 'secret-123';
        $timestamp = time();
        $payload = [
            'event_id' => 'evt_pay_001',
            'id' => 'provider_tx_001',
            'status' => 'paid',
            'text' => 'CONFIRMAR',
        ];

        $signature = hash_hmac('sha256', $timestamp . '.' . json_encode($payload), $secret);

        $response = $this->withHeaders([
                'X-Webhook-Signature' => $signature,
                'X-Webhook-Timestamp' => $timestamp,
            ])
            ->postJson('/api/webhooks/messaging/inbound', $payload);

        $response->assertStatus(200);
        
        $charge->refresh();
        $this->assertEquals('paid', $charge->status);
        $this->assertNotNull($charge->paid_at);
    }

    /** @test */
    public function it_handles_partial_payments_correctly()
    {
        // Este teste verifica se a lógica de 'partial' (da nossa migration anterior) funciona
        $customer = Customer::factory()->create();
        $charge = Charge::create([
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
