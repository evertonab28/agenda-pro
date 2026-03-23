<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\Service;
use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CheckoutFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_finalize_appointment_and_redirect_to_checkout_and_creates_charge()
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatus::Scheduled->value]);
        $this->assertNull($appointment->charge);

        $response = $this->actingAs($this->admin)
            ->patch(route('agenda.finalize', $appointment->id));

        $response->assertRedirect(route('agenda.checkout.show', $appointment->id));
        $this->assertEquals(AppointmentStatus::Completed->value, $appointment->fresh()->status);
        $this->assertNotNull($appointment->fresh()->charge);
        $this->assertEquals('pending', $appointment->fresh()->charge->status);
    }

    public function test_checkout_screen_shows_correct_data()
    {
        $service = Service::factory()->create(['price' => 120.50]);
        $appointment = Appointment::factory()->create([
            'service_id' => $service->id,
            'status' => AppointmentStatus::Completed->value
        ]);

        $response = $this->actingAs($this->admin)
            ->get(route('agenda.checkout.show', $appointment->id));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Agenda/Checkout')
            ->has('summary')
            ->where('summary.total_amount', 120.50)
        );
    }

    public function test_cannot_checkout_canceled_appointment()
    {
        $appointment = Appointment::factory()->create(['status' => AppointmentStatus::Canceled->value]);

        $response = $this->actingAs($this->admin)
            ->get(route('agenda.checkout.show', $appointment->id));

        $response->assertRedirect(route('agenda'));
        $response->assertSessionHas('error');
    }

    public function test_total_payment_marks_charge_as_paid_and_redirects_to_agenda()
    {
        $service = Service::factory()->create(['price' => 100]);
        $appointment = Appointment::factory()->create(['service_id' => $service->id]);

        $response = $this->actingAs($this->admin)
            ->post(route('agenda.checkout.store', $appointment->id), [
                'amount_received' => 100,
                'method' => 'pix',
                'received_at' => now()->toDateTimeString(),
            ]);

        $response->assertRedirect(route('agenda'));
        $this->assertEquals('paid', $appointment->charge->status);
    }
}
