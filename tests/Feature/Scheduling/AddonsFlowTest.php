<?php

namespace Tests\Feature\Scheduling;

use App\Models\Professional;
use App\Models\Service;
use App\Models\Workspace;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddonsFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $workspace;
    protected $professional;
    protected $mainService;
    protected $addonService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::factory()->create(['slug' => 'test-shop']);
        
        $this->professional = Professional::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_active' => true,
        ]);

        // Create a schedule for Monday
        $this->professional->schedules()->create([
            'workspace_id' => $this->workspace->id,
            'weekday' => 1, // Monday
            'start_time' => '09:00',
            'end_time' => '18:00',
            'is_active' => true,
        ]);

        $this->mainService = Service::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Corte de Cabelo',
            'duration_minutes' => 30,
            'price' => 50.00,
            'is_addon' => false,
            'is_active' => true,
        ]);

        $this->addonService = Service::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Lavagem',
            'duration_minutes' => 15,
            'price' => 20.00,
            'is_addon' => true,
            'is_active' => true,
        ]);

        $this->mainService->professionals()->attach($this->professional->id);
        $this->addonService->professionals()->attach($this->professional->id);
    }

    public function test_availability_considers_combined_duration()
    {
        // Monday next week
        $date = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        // Without addon (30 min)
        $response = $this->getJson("/p/test-shop/scheduling/availability?service_id={$this->mainService->id}&professional_id={$this->professional->id}&date={$date}");
        $response->assertStatus(200);
        $slotsWithoutAddon = $response->json();

        // With addon (30 + 15 = 45 min)
        $response = $this->getJson("/p/test-shop/scheduling/availability?service_id={$this->mainService->id}&addon_ids[]={$this->addonService->id}&professional_id={$this->professional->id}&date={$date}");
        $response->assertStatus(200);
        $slotsWithAddon = $response->json();

        // If at the end of the day (18:00), 17:30 is valid for 30min but NOT for 45min.
        $this->assertContains('17:30', $slotsWithoutAddon);
        $this->assertNotContains('17:30', $slotsWithAddon);
    }

    public function test_booking_calculates_total_price_and_duration_and_creates_items()
    {
        $date = Carbon::now()->next(Carbon::MONDAY)->setTime(10, 0);

        $payload = [
            'service_id' => $this->mainService->id,
            'addon_ids' => [$this->addonService->id],
            'professional_id' => $this->professional->id,
            'start_time' => $date->format('Y-m-d H:i'),
            'name' => 'João Silva',
            'phone' => '11999999999',
            'email' => 'joao@example.com',
        ];

        $response = $this->postJson("/p/test-shop/scheduling/book", $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('ok', true);

        $this->assertDatabaseHas('appointments', [
            'total_price' => 70.00, // 50 + 20
            'starts_at' => $date->toDateTimeString(),
            'ends_at' => $date->copy()->addMinutes(45)->toDateTimeString(),
        ]);

        $appointmentId = $response->json('appointment_id');
        
        $this->assertDatabaseHas('appointment_items', [
            'appointment_id' => $appointmentId,
            'service_id' => $this->mainService->id,
            'is_main' => true,
            'price' => 50.00,
        ]);

        $this->assertDatabaseHas('appointment_items', [
            'appointment_id' => $appointmentId,
            'service_id' => $this->addonService->id,
            'is_main' => false,
            'price' => 20.00,
        ]);
    }
}
