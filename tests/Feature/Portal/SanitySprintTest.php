<?php

namespace Tests\Feature\Portal;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Service;
use App\Models\Workspace;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers all fixes from the sanity sprint (pre-Sprint A):
 *
 * 1. Slot advance bug — was hardcoded 30min, now uses service duration_minutes
 * 2. Double-buffer bug — getAvailability() was passing duration+buffer to isAvailable(),
 *    which adds buffer again inside hasConflict(). Now only duration_minutes is passed.
 * 3. Cross-tenant isolation — validation rules now scope service_id/professional_id to workspace
 * 4. Customer matching — email-first, phone as exclusive fallback (no OR)
 * 5. Advance rules — min_advance_hours and max_advance_days enforced in store() and getAvailability()
 */
class SanitySprintTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected Professional $professional;
    protected Service $service;
    protected string $nextMonday;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace    = Workspace::factory()->create(['slug' => 'sanity-test']);
        $this->professional = Professional::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_active'    => true,
        ]);
        $this->service = Service::factory()->create([
            'workspace_id'     => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes'   => 0,
            'is_active'        => true,
        ]);
        $this->professional->services()->attach($this->service->id);

        ProfessionalSchedule::create([
            'workspace_id'    => $this->workspace->id,
            'professional_id' => $this->professional->id,
            'weekday'         => 1, // Monday
            'start_time'      => '08:00',
            'end_time'        => '18:00',
            'is_active'       => true,
        ]);

        $this->nextMonday = Carbon::parse('next monday')->format('Y-m-d');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Slot advance: slots must respect service duration, not a fixed 30min
    // ──────────────────────────────────────────────────────────────────────────

    public function test_availability_slots_advance_by_service_duration_not_30min(): void
    {
        // Service duration = 60 min, so slots should be at :00 only, not :30
        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'date'            => $this->nextMonday,
        ]));

        $response->assertOk();
        $slots = $response->json();

        $this->assertContains('08:00', $slots);
        $this->assertContains('09:00', $slots);
        $this->assertContains('17:00', $slots); // last slot: 17:00 + 60min = 18:00
        $this->assertNotContains('17:30', $slots); // 17:30 + 60min = 18:30 > 18:00

        // With 60min service: no :30 slots should appear (08:30, 09:30, etc.)
        foreach ($slots as $slot) {
            [$h, $m] = explode(':', $slot);
            $this->assertEquals('00', $m, "Slot {$slot} should be at :00 for a 60min service");
        }
    }

    public function test_availability_slots_advance_correctly_for_45min_service(): void
    {
        $service45 = Service::factory()->create([
            'workspace_id'     => $this->workspace->id,
            'duration_minutes' => 45,
            'buffer_minutes'   => 0,
            'is_active'        => true,
        ]);
        $this->professional->services()->attach($service45->id);

        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $this->professional->id,
            'service_id'      => $service45->id,
            'date'            => $this->nextMonday,
        ]));

        $response->assertOk();
        $slots = $response->json();

        // Sequence from 08:00 with 45min advance: 08:00, 08:45, 09:30, 10:15, ...
        $this->assertContains('08:00', $slots);
        $this->assertContains('08:45', $slots);
        $this->assertContains('09:30', $slots);
        $this->assertContains('10:15', $slots);

        // Last valid slot: 17:00 (17:00 + 45min = 17:45 ≤ 18:00)
        // 17:45 is NOT valid: 17:45 + 45min = 18:30 > 18:00
        $this->assertContains('17:00', $slots);
        $this->assertNotContains('17:45', $slots);
        $this->assertNotContains('18:00', $slots);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Double-buffer: a slot immediately after buffer window must be available
    // ──────────────────────────────────────────────────────────────────────────

    public function test_slot_not_rejected_by_double_buffer(): void
    {
        // Demonstrates the double-buffer bug that existed before this sprint.
        //
        // Service: 60min duration, 15min buffer.
        // New slot: 08:00–09:00 (buffered zone: 08:00–09:15).
        // Existing booking: starts at 09:20 (5 min after the correct buffer window ends at 09:15).
        //
        // Correct behavior: 08:00 is AVAILABLE — the new booking's buffer (09:15) does not
        //   reach the existing appointment (09:20). No conflict.
        //
        // Old double-buffer bug: getAvailability passed slotEnd = 08:00+60+15 = 09:15 to
        //   isAvailable(). Then hasConflict() added buffer again → effective end = 09:30.
        //   existing.starts_at (09:20) < 09:30 = TRUE → INCORRECT conflict rejection.
        //
        // With this fix: slotEnd = 08:00+60 = 09:00, hasConflict adds 15 → 09:15.
        //   existing.starts_at (09:20) < 09:15 = FALSE → correctly no conflict.

        $serviceWithBuffer = Service::factory()->create([
            'workspace_id'     => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes'   => 15,
            'is_active'        => true,
        ]);
        $this->professional->services()->attach($serviceWithBuffer->id);

        // Existing appointment starting at 09:20 (just after the 09:15 buffer of an 08:00 slot)
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $customer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $serviceWithBuffer->id,
            'starts_at'       => Carbon::parse("{$this->nextMonday} 09:20"),
            'ends_at'         => Carbon::parse("{$this->nextMonday} 10:20"),
            'status'          => 'scheduled',
        ]);

        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $this->professional->id,
            'service_id'      => $serviceWithBuffer->id,
            'date'            => $this->nextMonday,
        ]));

        $response->assertOk();
        $slots = $response->json();

        // 08:00 must be AVAILABLE: its buffer ends at 09:15, and existing starts at 09:20
        $this->assertContains('08:00', $slots,
            '08:00 should be available — buffer ends at 09:15 and existing starts at 09:20');

        // 09:00 must NOT be available: slotEnd=10:00, hasConflict end=10:15 > existing.starts_at (09:20)
        // AND existing.buffered_ends_at (10:35) > 09:00 → conflict
        $this->assertNotContains('09:00', $slots,
            '09:00 should be blocked — its buffer overlaps with the existing 09:20 appointment');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. Cross-tenant isolation: service/professional from another workspace rejected
    // ──────────────────────────────────────────────────────────────────────────

    public function test_availability_rejects_professional_from_other_workspace(): void
    {
        $otherWorkspace    = Workspace::factory()->create(['slug' => 'other-ws']);
        $otherProfessional = Professional::factory()->create(['workspace_id' => $otherWorkspace->id]);

        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $otherProfessional->id,
            'service_id'      => $this->service->id,
            'date'            => $this->nextMonday,
        ]));

        // Validation rule now uses Rule::exists scoped to workspace_id → 422
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['professional_id']);
    }

    public function test_availability_rejects_service_from_other_workspace(): void
    {
        $otherWorkspace = Workspace::factory()->create(['slug' => 'other-ws-2']);
        $otherService   = Service::factory()->create(['workspace_id' => $otherWorkspace->id]);

        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $this->professional->id,
            'service_id'      => $otherService->id,
            'date'            => $this->nextMonday,
        ]));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['service_id']);
    }

    public function test_store_rejects_professional_from_other_workspace(): void
    {
        $otherWorkspace    = Workspace::factory()->create(['slug' => 'other-ws-3']);
        $otherProfessional = Professional::factory()->create(['workspace_id' => $otherWorkspace->id]);

        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $otherProfessional->id,
            'start_time'      => "{$this->nextMonday} 10:00",
            'name'            => 'Test',
            'phone'           => '11999990000',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['professional_id']);
        $this->assertEquals(0, Appointment::count());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. Customer matching: email-first, phone as exclusive fallback (no OR)
    // ──────────────────────────────────────────────────────────────────────────

    public function test_store_finds_customer_by_email_ignoring_phone_match_on_different_customer(): void
    {
        // customerA: email=a@test.com, phone=11111111111
        // customerB: no email, phone=22222222222
        // Booking with email=a@test.com, phone=22222222222 (phone belongs to customerB)
        // Old OR logic would find both and pick the first (non-deterministic)
        // New logic: finds customerA by email, updates phone to 22222222222

        $customerA = Customer::factory()->create([
            'workspace_id' => $this->workspace->id,
            'email'        => 'a@test.com',
            'phone'        => '11111111111',
        ]);
        $customerB = Customer::factory()->create([
            'workspace_id' => $this->workspace->id,
            'email'        => null,
            'phone'        => '22222222222',
        ]);

        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => "{$this->nextMonday} 10:00",
            'name'            => 'A Test',
            'email'           => 'a@test.com',
            'phone'           => '22222222222',
        ]);

        $response->assertOk();
        $response->assertJson(['ok' => true]);

        // Appointment must be linked to customerA (found by email), NOT customerB
        $appointment = Appointment::first();
        $this->assertEquals($customerA->id, $appointment->customer_id,
            'Appointment should belong to customerA (matched by email), not customerB');

        // customerB phone must be untouched
        $customerB->refresh();
        $this->assertEquals('22222222222', $customerB->phone, 'customerB phone must not be changed');
    }

    public function test_store_falls_back_to_phone_when_no_email_provided(): void
    {
        $existingCustomer = Customer::factory()->create([
            'workspace_id' => $this->workspace->id,
            'email'        => null,
            'phone'        => '11999990000',
            'name'         => 'Existing',
        ]);

        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => "{$this->nextMonday} 10:00",
            'name'            => 'New Name',
            'phone'           => '11999990000', // same phone, no email
        ]);

        $response->assertOk();

        // Should reuse the existing customer (found by phone)
        $this->assertEquals(1, Customer::count(), 'No duplicate customer should be created');
        $appointment = Appointment::first();
        $this->assertEquals($existingCustomer->id, $appointment->customer_id);
    }

    public function test_store_creates_new_customer_when_email_not_found_and_no_phone_match(): void
    {
        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => "{$this->nextMonday} 10:00",
            'name'            => 'Brand New',
            'email'           => 'new@test.com',
            'phone'           => '11888880000',
        ]);

        $response->assertOk();
        $this->assertEquals(1, Customer::count());
        $this->assertDatabaseHas('customers', ['email' => 'new@test.com', 'phone' => '11888880000']);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Advance rules — store() rejects past and out-of-window bookings
    // ──────────────────────────────────────────────────────────────────────────

    public function test_store_rejects_booking_in_the_past(): void
    {
        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => now()->subHour()->format('Y-m-d H:i'),
            'name'            => 'Test',
            'phone'           => '11999990000',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['ok' => false, 'code' => 'past_time']);
        $this->assertEquals(0, Appointment::count());
    }

    public function test_store_rejects_booking_beyond_max_advance_days(): void
    {
        $this->workspace->update(['max_advance_days' => 30]);

        $farFuture = now()->addDays(31)->format('Y-m-d') . ' 10:00';

        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => $farFuture,
            'name'            => 'Test',
            'phone'           => '11999990000',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['ok' => false, 'code' => 'max_advance_exceeded']);
        $this->assertEquals(0, Appointment::count());
    }

    public function test_store_rejects_booking_before_min_advance_hours(): void
    {
        $this->workspace->update(['min_advance_hours' => 4]);

        // Booking 2h from now — less than the 4h minimum
        $tooSoon = now()->addHours(2)->format('Y-m-d H:i');

        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => $tooSoon,
            'name'            => 'Test',
            'phone'           => '11999990000',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['ok' => false, 'code' => 'min_advance_not_met']);
        $this->assertEquals(0, Appointment::count());
    }

    public function test_store_accepts_booking_exactly_at_min_advance_boundary(): void
    {
        // With min_advance_hours = 0 (default), any future slot is fine
        $this->workspace->update(['min_advance_hours' => null]);

        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => "{$this->nextMonday} 10:00",
            'name'            => 'Test',
            'phone'           => '11999990000',
        ]);

        $response->assertOk();
        $response->assertJson(['ok' => true]);
    }

    public function test_availability_hides_slots_beyond_max_advance_days(): void
    {
        $this->workspace->update(['max_advance_days' => 7]);

        // Request for a date beyond the window
        $beyondWindow = now()->addDays(8)->format('Y-m-d');

        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'date'            => $beyondWindow,
        ]));

        $response->assertOk();
        $response->assertExactJson([]); // no slots offered beyond window
    }

    public function test_availability_hides_slots_for_past_dates(): void
    {
        $yesterday = now()->subDay()->format('Y-m-d');

        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'date'            => $yesterday,
        ]));

        $response->assertOk();
        $response->assertExactJson([]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Buffer consistency smoke-test: buffer_minutes reflected in buffered_ends_at
    // ──────────────────────────────────────────────────────────────────────────

    public function test_appointment_buffered_ends_at_is_set_correctly_by_observer(): void
    {
        $serviceWithBuffer = Service::factory()->create([
            'workspace_id'     => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes'   => 15,
            'is_active'        => true,
        ]);
        $this->professional->services()->attach($serviceWithBuffer->id);

        $response = $this->postJson(route('portal.scheduling.book', $this->workspace->slug), [
            'service_id'      => $serviceWithBuffer->id,
            'professional_id' => $this->professional->id,
            'start_time'      => "{$this->nextMonday} 10:00",
            'name'            => 'Buffer Test',
            'phone'           => '11999990001',
        ]);

        $response->assertOk();

        $appointment = Appointment::first();
        $this->assertNotNull($appointment->buffered_ends_at);

        // ends_at = starts_at + 60min (duration only, no buffer in ends_at)
        $this->assertEquals(
            Carbon::parse("{$this->nextMonday} 11:00")->toDateTimeString(),
            $appointment->ends_at->toDateTimeString(),
            'ends_at should be starts_at + duration_minutes only'
        );

        // buffered_ends_at = ends_at + 15min buffer (set by AppointmentObserver)
        $this->assertEquals(
            Carbon::parse("{$this->nextMonday} 11:15")->toDateTimeString(),
            $appointment->buffered_ends_at->toDateTimeString(),
            'buffered_ends_at should be ends_at + buffer_minutes'
        );
    }
}
