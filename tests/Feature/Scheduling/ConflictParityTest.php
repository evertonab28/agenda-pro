<?php

namespace Tests\Feature\Scheduling;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use App\Models\Workspace;
use App\Services\AgendaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConflictParityTest extends TestCase
{
    use RefreshDatabase;

    protected AgendaService $agendaService;
    protected Workspace $workspace;
    protected \App\Models\Professional $professional;

    protected function setUp(): void
    {
        parent::setUp();
        $this->agendaService = new AgendaService();
        $this->workspace = Workspace::factory()->create();
        $this->professional = \App\Models\Professional::factory()->create([
            'workspace_id' => $this->workspace->id
        ]);
    }

    public function test_conflict_detection_including_buffer()
    {
        $service = Service::factory()->create([
            'workspace_id' => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes' => 15,
        ]);

        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

        // Existing appointment: 10:00 - 11:00 (Buffered until 11:15)
        Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $customer->id,
            'professional_id' => $this->professional->id,
            'service_id' => $service->id,
            'starts_at' => now()->startOfDay()->hour(10)->minute(0),
            'ends_at' => now()->startOfDay()->hour(11)->minute(0),
            'status' => 'confirmed'
        ]);

        // Case 1: New appointment starts at 11:10 (Conflict because of Buffer of 15m)
        $hasConflict1 = $this->agendaService->hasConflict(
            $this->professional->id,
            now()->startOfDay()->hour(11)->minute(10)->toDateTimeString(),
            now()->startOfDay()->hour(12)->minute(10)->toDateTimeString()
        );

        // Case 2: New appointment starts at 11:15 (NO Conflict)
        $hasConflict2 = $this->agendaService->hasConflict(
            $this->professional->id,
            now()->startOfDay()->hour(11)->minute(15)->toDateTimeString(),
            now()->startOfDay()->hour(12)->minute(15)->toDateTimeString()
        );

        $this->assertTrue($hasConflict1, "Should conflict because 11:10 is within the 11:15 buffer boundary.");
        $this->assertFalse($hasConflict2, "Should NOT conflict at 11:15 exact boundary.");
    }

    public function test_new_appointment_buffer_boundary()
    {
        $serviceA = Service::factory()->create([
            'workspace_id' => $this->workspace->id,
            'buffer_minutes' => 0
        ]);
        $serviceB = Service::factory()->create([
            'workspace_id' => $this->workspace->id,
            'buffer_minutes' => 30
        ]); 

        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

        // Existing A: 14:00 - 15:00
        Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $customer->id,
            'professional_id' => $this->professional->id,
            'service_id' => $serviceA->id,
            'starts_at' => now()->startOfDay()->hour(14)->minute(0),
            'ends_at' => now()->startOfDay()->hour(15)->minute(0),
            'status' => 'confirmed'
        ]);

        // New B (buffer 30m): 13:40 - 14:40 (Wait, 14:40 + 30m buffer = 15:10)
        // Conflict happens because B's buffer+end > A's start AND B's start < A's end.
        
        $hasConflict = $this->agendaService->hasConflict(
            $this->professional->id,
            now()->startOfDay()->hour(13)->minute(40)->toDateTimeString(),
            now()->startOfDay()->hour(14)->minute(40)->toDateTimeString(),
            null,
            30 // New service buffer
        );

        $this->assertTrue($hasConflict, "Conflict because B's buffer extends into A's time.");
    }
}
