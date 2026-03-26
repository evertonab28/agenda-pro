<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Charge;
use App\Models\Receipt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Carbon;

class FinanceReceiptTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $clinic;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clinic = \App\Models\Clinic::factory()->create();
        $this->admin = User::factory()->create(['clinic_id' => $this->clinic->id, 'role' => 'admin']);
        $this->fulfillOnboarding($this->clinic->id);
    }

    public function test_can_register_full_receipt()
    {
        $this->withoutExceptionHandling();
        $charge = Charge::factory()->create([
            'clinic_id' => $this->clinic->id,
            'amount' => 100.00,
            'status' => 'pending'
        ]);

        $data = [
            'amount_received' => 100.00,
            'received_at' => Carbon::now()->format('Y-m-d\TH:i'),
            'method' => 'pix',
            'fee_amount' => 0,
            'notes' => 'Full payment'
        ];

        $response = $this->actingAs($this->admin)
            ->from(route('finance.charges.index'))
            ->post(route('finance.charges.receive', $charge), $data);

        $response->assertRedirect(route('finance.charges.index'));
        $this->assertEquals('paid', $charge->fresh()->status);
        $this->assertDatabaseHas('receipts', [
            'charge_id' => $charge->id,
            'amount_received' => 100.00,
            'net_amount' => 100.00,
        ]);
    }

    public function test_can_register_partial_receipt_and_updates_status()
    {
        $charge = Charge::factory()->create([
            'clinic_id' => $this->clinic->id,
            'amount' => 100.00,
            'status' => 'pending'
        ]);

        $data = [
            'amount_received' => 60.00,
            'received_at' => Carbon::now()->format('Y-m-d\TH:i'),
            'method' => 'dinheiro',
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('finance.charges.receive', $charge), $data);

        $this->assertEquals('partial', $charge->fresh()->status);
        $this->assertDatabaseHas('receipts', [
            'charge_id' => $charge->id,
            'amount_received' => 60.00,
        ]);

        // Second payment to complete it
        $data2 = [
            'amount_received' => 40.00,
            'received_at' => Carbon::now()->format('Y-m-d\TH:i'),
            'method' => 'pix',
        ];

        $this->actingAs($this->admin)->post(route('finance.charges.receive', $charge), $data2);
        
        $this->assertEquals('paid', $charge->fresh()->status);
        $this->assertNotNull($charge->fresh()->paid_at);
        $this->assertEquals(2, $charge->receipts()->count());
    }

    public function test_cannot_receive_more_than_open_balance()
    {
        $charge = Charge::factory()->create([
            'clinic_id' => $this->clinic->id,
            'amount' => 50.00,
            'status' => 'pending'
        ]);

        $data = [
            'amount_received' => 60.00, // Over payment
            'received_at' => Carbon::now()->format('Y-m-d\TH:i'),
            'method' => 'pix',
        ];

        $response = $this->actingAs($this->admin)
            ->from(route('finance.charges.index'))
            ->post(route('finance.charges.receive', $charge), $data);

        $response->assertSessionHasErrors('amount_received');
        $this->assertEquals('pending', $charge->fresh()->status);
        $this->assertEquals(0, $charge->receipts()->count());
    }

    public function test_fee_calculation_is_correct()
    {
        $this->withoutExceptionHandling();
        $charge = Charge::factory()->create([
            'clinic_id' => $this->clinic->id,
            'amount' => 100.00,
            'status' => 'pending'
        ]);

        $data = [
            'amount_received' => 100.00,
            'received_at' => Carbon::now()->format('Y-m-d\TH:i'),
            'method' => 'cartao',
            'fee_amount' => 5.50,
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('finance.charges.receive', $charge), $data);

        $this->assertDatabaseHas('receipts', [
            'charge_id' => $charge->id,
            'amount_received' => 100.00,
            'fee_amount' => 5.50,
            'net_amount' => 94.50,
        ]);
    }
}
