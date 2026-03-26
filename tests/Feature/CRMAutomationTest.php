<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Clinic;
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
        $this->clinic = Clinic::factory()->create();
        $this->fulfillOnboarding($this->clinic->id);
    }

    public function test_canceling_appointment_triggers_waitlist_notification()
    {
        $service = Service::factory()->create(['clinic_id' => $this->clinic->id]);
        $customerInWaitlist = Customer::factory()->create(['clinic_id' => $this->clinic->id]);
        
        $waitlistEntry = WaitlistEntry::create([
            'clinic_id' => $this->clinic->id,
            'customer_id' => $customerInWaitlist->id,
            'service_id' => $service->id,
            'status' => WaitlistStatus::Waiting,
            'priority' => 10
        ]);

        $appointment = Appointment::factory()->create([
            'clinic_id' => $this->clinic->id,
            'service_id' => $service->id,
            'status' => 'pending'
        ]);

        // Simulating the cancellation
        $appointment->update(['status' => 'canceled']);

        // Assert waitlist entry was called
        $this->assertEquals(WaitlistStatus::Called, $waitlistEntry->fresh()->status);
        
        // Assert audit log or something else? 
        // For now the CRMService just calls MessagingService.
    }

    public function test_reengage_command_identifies_inactive_customers()
    {
        // 1. Inactive customer (last app 70 days ago)
        $inactive = Customer::factory()->create(['clinic_id' => $this->clinic->id]);
        Appointment::factory()->create([
            'clinic_id' => $this->clinic->id,
            'customer_id' => $inactive->id,
            'status' => 'finished',
            'starts_at' => now()->subDays(70)
        ]);

        // 2. Active customer (last app 10 days ago)
        $active = Customer::factory()->create(['clinic_id' => $this->clinic->id]);
        Appointment::factory()->create([
            'clinic_id' => $this->clinic->id,
            'customer_id' => $active->id,
            'status' => 'finished',
            'starts_at' => now()->subDays(10)
        ]);

        // Run the command
        $this->artisan('crm:re-engage');

        // Assert CRMAction was created for inactive only
        $this->assertDatabaseHas('crm_actions', [
            'clinic_id' => $this->clinic->id,
            'customer_id' => $inactive->id,
            'type' => 'reengagement'
        ]);

        $this->assertDatabaseMissing('crm_actions', [
            'clinic_id' => $this->clinic->id,
            'customer_id' => $active->id,
            'type' => 'reengagement'
        ]);
    }
}
