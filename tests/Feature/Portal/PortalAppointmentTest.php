<?php

namespace Tests\Feature\Portal;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class PortalAppointmentTest extends TestCase
{
    use RefreshDatabase;

    private $clinic;
    private $customer;
    private $professional;
    private $service;
    private $appointment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clinic = Clinic::factory()->create(['slug' => 'test-clinic']);
        $this->customer = Customer::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->professional = Professional::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->service = Service::factory()->create(['clinic_id' => $this->clinic->id, 'duration_minutes' => 60]);
        
        $this->appointment = Appointment::create([
            'clinic_id' => $this->clinic->id,
            'customer_id' => $this->customer->id,
            'professional_id' => $this->professional->id,
            'service_id' => $this->service->id,
            'starts_at' => Carbon::parse('next monday 10:00'),
            'ends_at' => Carbon::parse('next monday 11:00'),
            'status' => 'scheduled'
        ]);
    }

    public function test_customer_can_cancel_own_appointment()
    {
        $response = $this->actingAs($this->customer, 'customer')
            ->post(route('portal.appointments.cancel', [$this->clinic->slug, $this->appointment->id]));

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
        
        $this->appointment->refresh();
        $this->assertEquals('cancelled', $this->appointment->status);
    }

    public function test_customer_cannot_cancel_others_appointment()
    {
        $otherCustomer = Customer::factory()->create(['clinic_id' => $this->clinic->id]);
        
        $response = $this->actingAs($otherCustomer, 'customer')
            ->post(route('portal.appointments.cancel', [$this->clinic->slug, $this->appointment->id]));

        $response->assertStatus(404);
    }

    public function test_customer_can_reschedule_own_appointment()
    {
        $newTime = Carbon::parse('next tuesday 14:00')->format('Y-m-d H:i');
        
        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->clinic->slug, $this->appointment->id]), [
                'start_time' => $newTime
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
        
        $this->appointment->refresh();
        $this->assertEquals(Carbon::parse($newTime)->toDateTimeString(), $this->appointment->starts_at->toDateTimeString());
    }

    public function test_customer_cannot_reschedule_to_overlapping_slot()
    {
        $otherAppointment = Appointment::create([
            'clinic_id' => $this->clinic->id,
            'customer_id' => Customer::factory()->create(['clinic_id' => $this->clinic->id])->id,
            'professional_id' => $this->professional->id,
            'service_id' => $this->service->id,
            'starts_at' => Carbon::parse('next tuesday 14:00'),
            'ends_at' => Carbon::parse('next tuesday 15:00'),
            'status' => 'scheduled'
        ]);

        $overlappingTime = Carbon::parse('next tuesday 14:30')->format('Y-m-d H:i');
        
        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->clinic->slug, $this->appointment->id]), [
                'start_time' => $overlappingTime
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => false]);
        $this->assertStringContainsString('ocupado', $response->json('message'));
    }
}
