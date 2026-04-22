<?php

namespace Tests\Feature\Portal;

use App\Models\Appointment;
use App\Models\Holiday;
use App\Models\ProfessionalSchedule;
use App\Models\Workspace;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class PortalAppointmentTest extends TestCase
{
    use RefreshDatabase;

    private $workspace;
    private $customer;
    private $professional;
    private $service;
    private $appointment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create(['slug' => 'test-workspace']);
        $this->customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->professional = Professional::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->service = Service::factory()->create(['workspace_id' => $this->workspace->id, 'duration_minutes' => 60]);

        $this->appointment = Appointment::create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $this->customer->id,
            'professional_id' => $this->professional->id,
            'service_id' => $this->service->id,
            'starts_at' => Carbon::parse('next monday 10:00'),
            'ends_at' => Carbon::parse('next monday 11:00'),
            'status' => 'scheduled'
        ]);

        // Schedule para segunda (dia do appointment base)
        ProfessionalSchedule::create([
            'workspace_id'    => $this->workspace->id,
            'professional_id' => $this->professional->id,
            'weekday'         => Carbon::parse('next monday')->dayOfWeek,
            'start_time'      => '08:00',
            'end_time'        => '18:00',
            'is_active'       => true,
        ]);

        // Schedule para terça (dia usado nos testes de reschedule)
        ProfessionalSchedule::create([
            'workspace_id'    => $this->workspace->id,
            'professional_id' => $this->professional->id,
            'weekday'         => Carbon::parse('next tuesday')->dayOfWeek,
            'start_time'      => '08:00',
            'end_time'        => '18:00',
            'is_active'       => true,
        ]);
    }

    public function test_customer_can_cancel_own_appointment()
    {
        $response = $this->actingAs($this->customer, 'customer')
            ->post(route('portal.appointments.cancel', [$this->workspace->slug, $this->appointment->id]));

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);

        $this->appointment->refresh();
        $this->assertEquals('canceled', $this->appointment->status);
    }

    public function test_customer_cannot_cancel_others_appointment()
    {
        $otherCustomer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

        $response = $this->actingAs($otherCustomer, 'customer')
            ->post(route('portal.appointments.cancel', [$this->workspace->slug, $this->appointment->id]));

        $response->assertStatus(404);
    }

    public function test_customer_can_reschedule_own_appointment()
    {
        $newTime = Carbon::parse('next tuesday 14:00')->format('Y-m-d H:i');

        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->workspace->slug, $this->appointment->id]), [
                'start_time' => $newTime
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);

        $this->appointment->refresh();
        $this->assertEquals(Carbon::parse($newTime)->toDateTimeString(), $this->appointment->starts_at->toDateTimeString());
    }

    public function test_customer_cannot_reschedule_to_overlapping_slot()
    {
        $otherAppointment = Appointment::create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => Customer::factory()->create(['workspace_id' => $this->workspace->id])->id,
            'professional_id' => $this->professional->id,
            'service_id' => $this->service->id,
            'starts_at' => Carbon::parse('next tuesday 14:00'),
            'ends_at' => Carbon::parse('next tuesday 15:00'),
            'status' => 'scheduled'
        ]);

        $overlappingTime = Carbon::parse('next tuesday 14:30')->format('Y-m-d H:i');

        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->workspace->slug, $this->appointment->id]), [
                'start_time' => $overlappingTime
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => false]);
        $this->assertStringContainsString('disponível', $response->json('message'));
    }

    public function test_customer_cannot_reschedule_to_slot_blocked_by_buffer(): void
    {
        // Serviço com 30 min de buffer
        $serviceWithBuffer = Service::factory()->create([
            'workspace_id'     => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes'   => 30,
        ]);

        // Appointment existente: terça 14:00–15:00, buffered_ends_at = 15:30
        $otherCustomer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $otherCustomer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $serviceWithBuffer->id,
            'starts_at'       => Carbon::parse('next tuesday 14:00'),
            'ends_at'         => Carbon::parse('next tuesday 15:00'),
            'status'          => 'scheduled',
        ]);

        // Tentar reagendar para terça 15:10 — dentro do buffer (15:30)
        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->workspace->slug, $this->appointment->id]), [
                'start_time' => Carbon::parse('next tuesday 15:10')->format('Y-m-d H:i'),
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => false]);
    }

    public function test_customer_cannot_reschedule_to_holiday(): void
    {
        $tuesday = Carbon::parse('next tuesday')->format('Y-m-d');

        Holiday::create([
            'workspace_id'    => $this->workspace->id,
            'name'            => 'Feriado Teste',
            'date'            => $tuesday,
            'professional_id' => null,
            'repeats_yearly'  => false,
        ]);

        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->workspace->slug, $this->appointment->id]), [
                'start_time' => Carbon::parse('next tuesday 10:00')->format('Y-m-d H:i'),
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => false]);
    }

    public function test_customer_cannot_reschedule_outside_working_hours(): void
    {
        // Terça às 07:00 — antes das 08:00 do schedule
        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->workspace->slug, $this->appointment->id]), [
                'start_time' => Carbon::parse('next tuesday 07:00')->format('Y-m-d H:i'),
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => false]);
    }

    public function test_customer_cannot_reschedule_during_break(): void
    {
        // Adicionar break ao schedule de terça
        ProfessionalSchedule::where('professional_id', $this->professional->id)
            ->where('weekday', Carbon::parse('next tuesday')->dayOfWeek)
            ->update(['break_start' => '12:00', 'break_end' => '13:00']);

        $response = $this->actingAs($this->customer, 'customer')
            ->put(route('portal.appointments.reschedule', [$this->workspace->slug, $this->appointment->id]), [
                'start_time' => Carbon::parse('next tuesday 12:00')->format('Y-m-d H:i'),
            ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => false]);
    }
}
