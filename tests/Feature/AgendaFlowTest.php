<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgendaFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_appointment()
    {
        $clinic = \App\Models\Clinic::factory()->create();
        $user = User::factory()->create(['clinic_id' => $clinic->id, 'role' => 'admin']);
        $this->fulfillOnboarding($clinic->id);
        $this->actingAs($user);

        $customer = Customer::factory()->create(['clinic_id' => $clinic->id]);
        $service = Service::factory()->create(['clinic_id' => $clinic->id, 'duration_minutes' => 60]);
        $professional = \App\Models\Professional::factory()->create(['clinic_id' => $clinic->id]);
        
        \App\Models\ProfessionalSchedule::create([
            'clinic_id' => $clinic->id,
            'professional_id' => $professional->id,
            'weekday' => \Carbon\Carbon::parse('2026-12-25')->dayOfWeek,
            'start_time' => '08:00',
            'end_time' => '18:00',
            'is_active' => true,
        ]);

        $response = $this->post(route('agenda.store'), [
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-12-25 14:00:00',
            'ends_at' => '2026-12-25 15:00:00',
            'status' => 'scheduled',
            'notes' => 'Test note',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('appointments', [
            'customer_id' => $customer->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-12-25 14:00:00',
        ]);
    }

    public function test_cannot_create_appointment_with_conflict()
    {
        $clinic = \App\Models\Clinic::factory()->create();
        $user = User::factory()->create(['clinic_id' => $clinic->id, 'role' => 'admin']);
        $this->fulfillOnboarding($clinic->id);
        $this->actingAs($user);

        $professional = \App\Models\Professional::factory()->create(['clinic_id' => $clinic->id]);
        
        \App\Models\ProfessionalSchedule::create([
            'clinic_id' => $clinic->id,
            'professional_id' => $professional->id,
            'weekday' => \Carbon\Carbon::parse('2026-12-25')->dayOfWeek,
            'start_time' => '08:00',
            'end_time' => '18:00',
            'is_active' => true,
        ]);

        Appointment::factory()->create([
            'clinic_id' => $clinic->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-12-25 10:00:00',
            'ends_at' => '2026-12-25 11:00:00',
        ]);

        $customer = Customer::factory()->create(['clinic_id' => $clinic->id]);
        $service = Service::factory()->create(['clinic_id' => $clinic->id]);

        $response = $this->from(route('agenda'))->post(route('agenda.store'), [
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-12-25 10:30:00',
            'ends_at' => '2026-12-25 11:30:00',
            'status' => 'scheduled',
        ]);

        $response->assertRedirect(route('agenda'));
        $response->assertSessionHasErrors(['starts_at']);
        $this->assertEquals(1, Appointment::count());
    }
}
