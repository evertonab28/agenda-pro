<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\Service;
use App\Models\Charge;
use App\Services\CheckoutService;
use App\Enums\ChargeStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CheckoutServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $checkoutService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->checkoutService = new CheckoutService();
    }

    public function test_it_ensures_charge_only_once_for_appointment()
    {
        $customer = Customer::factory()->create();
        $professional = Professional::factory()->create();
        $service = Service::factory()->create(['price' => 100]);
        $appointment = Appointment::factory()->create([
            'customer_id' => $customer->id,
            'professional_id' => $professional->id,
            'service_id' => $service->id,
        ]);

        $charge1 = $this->checkoutService->ensureChargeForAppointment($appointment);
        $charge2 = $this->checkoutService->ensureChargeForAppointment($appointment);

        $this->assertEquals($charge1->id, $charge2->id);
        $this->assertEquals(1, Charge::count());
        $this->assertEquals(100, $charge1->amount);
    }

    public function test_it_registers_total_payment_and_marks_as_paid()
    {
        $charge = Charge::factory()->create(['amount' => 150, 'status' => ChargeStatus::Pending->value]);

        $this->checkoutService->registerPayment($charge, [
            'amount_received' => 150,
            'method' => 'pix',
            'received_at' => now()->toDateTimeString(),
        ]);

        $this->assertEquals(ChargeStatus::Paid->value, $charge->fresh()->status);
        $this->assertNotNull($charge->fresh()->paid_at);
    }

    public function test_it_registers_partial_payment_and_marks_as_partial()
    {
        $charge = Charge::factory()->create(['amount' => 150, 'status' => ChargeStatus::Pending->value]);

        $this->checkoutService->registerPayment($charge, [
            'amount_received' => 50,
            'method' => 'cash',
            'received_at' => now()->toDateTimeString(),
        ]);

        $this->assertEquals(ChargeStatus::Partial->value, $charge->fresh()->status);
        $this->assertEquals(1, $charge->receipts()->count());
    }

    public function test_it_prepares_checkout_data_correctly()
    {
        $service = Service::factory()->create(['price' => 200]);
        $appointment = Appointment::factory()->create(['service_id' => $service->id]);
        
        $data = $this->checkoutService->prepareCheckoutData($appointment);

        $this->assertArrayHasKey('summary', $data);
        $this->assertEquals(200, $data['summary']['total_amount']);
        $this->assertEquals(0, $data['summary']['amount_paid']);
        $this->assertEquals(200, $data['summary']['balance']);
    }
}
