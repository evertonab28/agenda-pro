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
        $user = User::factory()->create();
        $this->actingAs($user);

        $customer = Customer::factory()->create();
        $service = Service::factory()->create(['duration_minutes' => 60]);
        $professional = User::factory()->create();

        $response = $this->post(route('agenda.store'), [
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-03-22 14:00:00',
            'ends_at' => '2026-03-22 15:00:00',
            'status' => 'scheduled',
            'notes' => 'Test note',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('appointments', [
            'customer_id' => $customer->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-03-22 14:00:00',
        ]);
    }

    public function test_cannot_create_appointment_with_conflict()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $professional = User::factory()->create();
        
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-03-22 10:00:00',
            'ends_at' => '2026-03-22 11:00:00',
        ]);

        $customer = Customer::factory()->create();
        $service = Service::factory()->create();

        $response = $this->from(route('agenda'))->post(route('agenda.store'), [
            'customer_id' => $customer->id,
            'service_id' => $service->id,
            'professional_id' => $professional->id,
            'starts_at' => '2026-03-22 10:30:00',
            'ends_at' => '2026-03-22 11:30:00',
            'status' => 'scheduled',
        ]);

        $response->assertRedirect(route('agenda'));
        $response->assertSessionHasErrors(['starts_at']);
        $this->assertEquals(1, Appointment::count());
    }
}
