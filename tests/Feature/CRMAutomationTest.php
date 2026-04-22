<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Workspace;
use App\Models\Customer;
use App\Models\Service;
use App\Models\WaitlistEntry;
use App\Models\CRMAction;
use App\Enums\WaitlistStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CRMAutomationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->fulfillOnboarding($this->workspace->id);
    }

    public function test_canceling_appointment_triggers_waitlist_notification()
    {
        $service = Service::factory()->create(['workspace_id' => $this->workspace->id]);
        $customerInWaitlist = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

        $waitlistEntry = WaitlistEntry::create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $customerInWaitlist->id,
            'service_id' => $service->id,
            'status' => WaitlistStatus::Waiting,
            'priority' => 10
        ]);

        $appointment = Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'service_id' => $service->id,
            'status' => 'scheduled'
        ]);

        app(\App\Services\AppointmentLifecycleService::class)->cancel($appointment);

        $this->assertEquals(WaitlistStatus::Called, $waitlistEntry->fresh()->status);
    }

    public function test_reengage_command_identifies_inactive_customers()
    {
        $inactive = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $inactive->id,
            'status' => 'completed',
            'starts_at' => now()->subDays(70)
        ]);

        $active = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $active->id,
            'status' => 'completed',
            'starts_at' => now()->subDays(10)
        ]);

        $this->artisan('crm:re-engage');

        $this->assertDatabaseHas('crm_actions', [
            'workspace_id' => $this->workspace->id,
            'customer_id' => $inactive->id,
            'type' => 'reengagement'
        ]);

        $this->assertDatabaseMissing('crm_actions', [
            'workspace_id' => $this->workspace->id,
            'customer_id' => $active->id,
            'type' => 'reengagement'
        ]);
    }
}
