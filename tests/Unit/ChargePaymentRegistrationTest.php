<?php

namespace Tests\Unit;

use App\Enums\ChargeStatus;
use App\Models\Charge;
use App\Models\Receipt;
use App\Services\FinanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChargePaymentRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_mark_charge_paid_creates_synthetic_receipt_for_open_balance(): void
    {
        $charge = Charge::factory()->create([
            'amount' => 150,
            'status' => ChargeStatus::Pending->value,
        ]);

        app(FinanceService::class)->markChargePaid($charge, [
            'payment_method' => 'pix',
            'paid_at' => '2026-12-25 10:00:00',
        ]);

        $this->assertSame(ChargeStatus::Paid->value, $charge->fresh()->status);
        $this->assertSame(1, $charge->receipts()->count());
        $this->assertEquals(150, (float) $charge->receipts()->first()->amount_received);
    }

    public function test_mark_charge_paid_is_idempotent_when_already_paid(): void
    {
        $charge = Charge::factory()->create([
            'amount' => 150,
            'status' => ChargeStatus::Paid->value,
            'paid_at' => now(),
        ]);

        Receipt::factory()->create([
            'workspace_id' => $charge->workspace_id,
            'charge_id' => $charge->id,
            'amount_received' => 150,
            'fee_amount' => 0,
            'net_amount' => 150,
        ]);

        app(FinanceService::class)->markChargePaid($charge, ['payment_method' => 'pix']);

        $this->assertSame(1, $charge->receipts()->count());
    }

    public function test_mark_charge_paid_only_receipts_open_balance_after_partial_payment(): void
    {
        $charge = Charge::factory()->create([
            'amount' => 150,
            'status' => ChargeStatus::Partial->value,
        ]);

        Receipt::factory()->create([
            'workspace_id' => $charge->workspace_id,
            'charge_id' => $charge->id,
            'amount_received' => 50,
            'fee_amount' => 0,
            'net_amount' => 50,
        ]);

        app(FinanceService::class)->markChargePaid($charge, ['payment_method' => 'card']);

        $this->assertSame(ChargeStatus::Paid->value, $charge->fresh()->status);
        $this->assertSame(2, $charge->receipts()->count());
        $this->assertEquals(100, (float) $charge->receipts()->latest('id')->first()->amount_received);
    }
}
