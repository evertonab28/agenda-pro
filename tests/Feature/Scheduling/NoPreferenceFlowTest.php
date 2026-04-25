<?php

namespace Tests\Feature\Scheduling;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Service;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class NoPreferenceFlowTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected Service $service;
    protected Professional $p1;
    protected Professional $p2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->service = Service::factory()->create([
            'workspace_id' => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes' => 0,
        ]);

        $this->p1 = Professional::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'Profissional A']);
        $this->p2 = Professional::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'Profissional B']);

        $this->service->professionals()->attach([$this->p1->id, $this->p2->id]);

        // Setup Schedules for both (Monday to Friday)
        foreach ([$this->p1, $this->p2] as $p) {
            for ($i = 1; $i <= 5; $i++) {
                ProfessionalSchedule::create([
                    'professional_id' => $p->id,
                    'weekday' => $i,
                    'start_time' => '08:00',
                    'end_time' => '12:00',
                    'is_active' => true,
                ]);
            }
        }
    }

    public function test_get_availability_with_no_preference_aggregates_slots()
    {
        $date = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        // Create appointment for p1 at 08:00
        Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'professional_id' => $this->p1->id,
            'service_id' => $this->service->id,
            'starts_at' => $date . ' 08:00:00',
            'ends_at' => $date . ' 09:00:00',
            'status' => 'scheduled',
        ]);

        // When requesting availability with professional_id = 0 (no preference)
        // 08:00 should still be available because p2 is free
        $response = $this->getJson("/p/{$this->workspace->slug}/scheduling/availability?service_id={$this->service->id}&professional_id=0&date={$date}");

        $response->assertStatus(200);
        $slots = $response->json();

        $this->assertContains('08:00', $slots, "08:00 should be available because Professional B is free.");
        $this->assertContains('09:00', $slots);
        $this->assertContains('10:00', $slots);
        $this->assertContains('11:00', $slots);
    }

    public function test_booking_with_no_preference_assigns_available_professional_deterministically()
    {
        $date = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');
        $startTime = $date . ' 08:00';

        // p1 is busy at 08:00
        Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'professional_id' => $this->p1->id,
            'service_id' => $this->service->id,
            'starts_at' => $date . ' 08:00:00',
            'ends_at' => $date . ' 09:00:00',
            'status' => 'scheduled',
        ]);

        $payload = [
            'service_id' => $this->service->id,
            'professional_id' => 0, // No preference
            'start_time' => $startTime,
            'name' => 'Customer Test',
            'phone' => '11999999999',
            'email' => 'test@example.com',
        ];

        $response = $this->postJson("/p/{$this->workspace->slug}/scheduling/book", $payload);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);

        $appointment = Appointment::where('workspace_id', $this->workspace->id)
            ->where('starts_at', $date . ' 08:00:00')
            ->where('customer_id', '!=', null)
            ->where('professional_id', $this->p2->id) // Should be p2 because p1 is busy
            ->first();

        $this->assertNotNull($appointment, "Appointment should have been created for Professional B.");
    }

    public function test_booking_with_no_preference_prefers_first_professional_if_both_available()
    {
        $date = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');
        $startTime = $date . ' 10:00';

        // Both p1 and p2 are free at 10:00
        $payload = [
            'service_id' => $this->service->id,
            'professional_id' => 0, // No preference
            'start_time' => $startTime,
            'name' => 'Customer Test',
            'phone' => '11999999999',
            'email' => 'test2@example.com',
        ];

        $response = $this->postJson("/p/{$this->workspace->slug}/scheduling/book", $payload);

        $response->assertStatus(200);

        // Should pick p1 (first by ID/determinism)
        $appointment = Appointment::where('starts_at', $date . ' 10:00:00')->first();
        $this->assertEquals($this->p1->id, $appointment->professional_id);
    }
}
