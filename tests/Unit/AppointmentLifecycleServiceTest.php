<?php

namespace Tests\Unit;

use App\Enums\AppointmentStatus;
use App\Enums\ChargeStatus;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\ProfessionalSchedule;
use App\Models\Receipt;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Workspace;
use App\Services\AppointmentLifecycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentLifecycleServiceTest extends TestCase
{
    use RefreshDatabase;

    private AppointmentLifecycleService $lifecycle;

    protected function setUp(): void
    {
        parent::setUp();
        $this->lifecycle = app(AppointmentLifecycleService::class);
    }

    public function test_complete_marks_appointment_completed_and_guarantees_pending_charge(): void
    {
        $appointment = Appointment::factory()->create([
            'starts_at' => '2026-12-25 10:00:00',
            'status' => AppointmentStatus::Scheduled->value,
        ]);

        $this->lifecycle->complete($appointment);
        $this->lifecycle->complete($appointment->fresh());

        $this->assertSame(AppointmentStatus::Completed->value, $appointment->fresh()->status);
        $this->assertSame(1, Charge::where('appointment_id', $appointment->id)->count());

        $charge = $appointment->fresh()->charge;
        $this->assertSame(ChargeStatus::Pending->value, $charge->status);
        $this->assertSame('2026-12-25', $charge->due_date->toDateString());
    }

    public function test_cancel_applies_operational_charge_policy(): void
    {
        $pendingAppointment = Appointment::factory()->create();
        $pendingCharge = Charge::factory()->create([
            'workspace_id' => $pendingAppointment->workspace_id,
            'appointment_id' => $pendingAppointment->id,
            'customer_id' => $pendingAppointment->customer_id,
            'status' => ChargeStatus::Pending->value,
        ]);

        $overdueAppointment = Appointment::factory()->create();
        $overdueCharge = Charge::factory()->create([
            'workspace_id' => $overdueAppointment->workspace_id,
            'appointment_id' => $overdueAppointment->id,
            'customer_id' => $overdueAppointment->customer_id,
            'status' => ChargeStatus::Overdue->value,
        ]);

        $partialAppointment = Appointment::factory()->create();
        $partialCharge = Charge::factory()->create([
            'workspace_id' => $partialAppointment->workspace_id,
            'appointment_id' => $partialAppointment->id,
            'customer_id' => $partialAppointment->customer_id,
            'status' => ChargeStatus::Partial->value,
        ]);
        Receipt::factory()->create([
            'workspace_id' => $partialAppointment->workspace_id,
            'charge_id' => $partialCharge->id,
            'amount_received' => 10,
        ]);

        $paidAppointment = Appointment::factory()->create();
        $paidCharge = Charge::factory()->create([
            'workspace_id' => $paidAppointment->workspace_id,
            'appointment_id' => $paidAppointment->id,
            'customer_id' => $paidAppointment->customer_id,
            'status' => ChargeStatus::Paid->value,
        ]);

        $this->lifecycle->cancel($pendingAppointment);
        $this->lifecycle->cancel($overdueAppointment);
        $this->lifecycle->cancel($partialAppointment);
        $this->lifecycle->cancel($paidAppointment);

        $this->assertSame(ChargeStatus::Canceled->value, $pendingCharge->fresh()->status);
        $this->assertSame(ChargeStatus::Canceled->value, $overdueCharge->fresh()->status);
        $this->assertSame(ChargeStatus::Partial->value, $partialCharge->fresh()->status);
        $this->assertSame(ChargeStatus::Paid->value, $paidCharge->fresh()->status);
    }

    public function test_no_show_fee_is_configurable_separate_and_idempotent(): void
    {
        $workspace = Workspace::factory()->create();
        $service = Service::factory()->create(['workspace_id' => $workspace->id, 'price' => 200]);
        $appointment = Appointment::factory()->create([
            'workspace_id' => $workspace->id,
            'service_id' => $service->id,
            'starts_at' => '2026-12-25 10:00:00',
        ]);

        Setting::setForWorkspace($workspace->id, 'no_show_fee_enabled', true);
        Setting::setForWorkspace($workspace->id, 'no_show_fee_amount', 50);

        app(\App\Services\CheckoutService::class)->ensureChargeForAppointment($appointment);
        $this->lifecycle->markNoShow($appointment);
        $this->lifecycle->markNoShow($appointment->fresh());

        $this->assertSame(AppointmentStatus::NoShow->value, $appointment->fresh()->status);
        $this->assertSame(1, Charge::where('appointment_id', $appointment->id)->count());
        $this->assertSame(1, Charge::where('reference_type', 'no_show_fee')->where('reference_id', $appointment->id)->count());
    }

    public function test_reschedule_keeps_canonical_scheduled_status_and_moves_open_charge_due_date(): void
    {
        $appointment = Appointment::factory()->create([
            'starts_at' => '2026-12-25 10:00:00',
            'ends_at' => '2026-12-25 11:00:00',
            'status' => AppointmentStatus::Confirmed->value,
        ]);

        ProfessionalSchedule::create([
            'workspace_id' => $appointment->workspace_id,
            'professional_id' => $appointment->professional_id,
            'weekday' => \Carbon\Carbon::parse('2026-12-26')->dayOfWeek,
            'start_time' => '08:00',
            'end_time' => '18:00',
            'is_active' => true,
        ]);

        $charge = Charge::factory()->create([
            'workspace_id' => $appointment->workspace_id,
            'appointment_id' => $appointment->id,
            'customer_id' => $appointment->customer_id,
            'status' => ChargeStatus::Pending->value,
            'due_date' => '2026-12-25',
        ]);

        $this->lifecycle->reschedule($appointment, '2026-12-26 12:00:00');

        $this->assertSame(AppointmentStatus::Scheduled->value, $appointment->fresh()->status);
        $this->assertSame('2026-12-26', $charge->fresh()->due_date->toDateString());
    }
}
