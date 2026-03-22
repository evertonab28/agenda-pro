<?php

namespace Tests\Unit;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Services\AgendaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgendaServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AgendaService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AgendaService();
    }

    public function test_can_detect_conflicts()
    {
        $professional = User::factory()->create();
        
        Appointment::factory()->create([
            'professional_id' => $professional->id,
            'starts_at' => '2026-03-22 10:00:00',
            'ends_at' => '2026-03-22 11:00:00',
        ]);

        // Exact same time
        $this->assertTrue($this->service->hasConflict(
            $professional->id,
            '2026-03-22 10:00:00',
            '2026-03-22 11:00:00'
        ));

        // Overlap start
        $this->assertTrue($this->service->hasConflict(
            $professional->id,
            '2026-03-22 09:30:00',
            '2026-03-22 10:30:00'
        ));

        // Overlap end
        $this->assertTrue($this->service->hasConflict(
            $professional->id,
            '2026-03-22 10:30:00',
            '2026-03-22 11:30:00'
        ));

        // No conflict (after)
        $this->assertFalse($this->service->hasConflict(
            $professional->id,
            '2026-03-22 11:00:00',
            '2026-03-22 12:00:00'
        ));

        // No conflict (before)
        $this->assertFalse($this->service->hasConflict(
            $professional->id,
            '2026-03-22 09:00:00',
            '2026-03-22 10:00:00'
        ));
    }

    public function test_can_calculate_end_date()
    {
        $service = Service::factory()->create(['duration_minutes' => 45]);
        $start = '2026-03-22 10:00:00';
        
        $end = $this->service->calculateEndDate($service->id, $start);
        
        $this->assertEquals('2026-03-22 10:45:00', $end->format('Y-m-d H:i:s'));
    }
}
