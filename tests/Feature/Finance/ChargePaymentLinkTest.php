<?php

namespace Tests\Feature\Finance;

use App\Models\Charge;
use App\Models\Customer;
use App\Models\Appointment;
use App\Services\Finance\PaymentLinkServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChargePaymentLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed a basic state if needed
    }

    /** @test */
    public function it_persists_payment_link_hash_when_generated()
    {
        $customer = Customer::factory()->create();
        $charge = Charge::create([
            'customer_id' => $customer->id,
            'amount' => 150.00,
            'status' => 'pending',
            'due_date' => now()->addDays(5),
            'reference_month' => now()->month,
            'reference_year' => now()->year,
        ]);

        $service = app(PaymentLinkServiceInterface::class);
        $link = $service->generate($charge);

        $charge->refresh();

        $this->assertNotNull($charge->payment_link_hash);
        $this->assertEquals('pending', $charge->status);
        $this->assertStringContainsString($charge->payment_link_hash, $link);
    }

    /** @test */
    public function it_generates_different_hash_on_regeneration()
    {
        $customer = Customer::factory()->create();
        $charge = Charge::create([
            'customer_id' => $customer->id,
            'amount' => 100.00,
            'status' => 'pending',
            'due_date' => now()->addDays(1),
        ]);

        $service = app(PaymentLinkServiceInterface::class);
        
        $firstHash = $service->generate($charge);
        $charge->refresh();
        $hash1 = $charge->payment_link_hash;

        $secondHash = $service->generate($charge);
        $charge->refresh();
        $hash2 = $charge->payment_link_hash;

        $this->assertNotEquals($hash1, $hash2);
    }

    /** @test */
    public function it_blocks_link_generation_for_already_paid_charges()
    {
        $customer = Customer::factory()->create();
        $charge = Charge::create([
            'customer_id' => $customer->id,
            'amount' => 200.00,
            'status' => 'paid',
            'paid_at' => now(),
            'due_date' => now()->subDay(),
        ]);

        $service = app(PaymentLinkServiceInterface::class);
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Cannot generate link for paid charge');
        
        $service->generate($charge);
    }

    /** @test */
    public function it_logs_clicks_on_payment_link()
    {
        $customer = Customer::factory()->create();
        $charge = Charge::create([
            'customer_id' => $customer->id,
            'amount' => 50.00,
            'status' => 'pending',
            'due_date' => now()->addDays(2),
            'payment_link_hash' => 'test-hash-123',
        ]);

        $initialClicks = $charge->payment_link_clicks;

        $response = $this->get(route('payment.direct', ['hash' => 'test-hash-123']));
        
        $response->assertStatus(200); // Or 302 if redirect
        
        $charge->refresh();
        $this->assertEquals($initialClicks + 1, $charge->payment_link_clicks);
    }
}
