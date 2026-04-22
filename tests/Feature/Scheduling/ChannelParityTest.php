<?php

namespace Tests\Feature\Scheduling;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Holiday;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Service;
use App\Models\User;
use App\Models\Workspace;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChannelParityTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected Professional $professional;
    protected Service $service;
    protected Customer $customer;
    protected User $adminUser;
    protected Appointment $existingAppointment;
    protected string $testDate;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace    = Workspace::factory()->create(['slug' => 'parity-test']);
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
        $this->customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->adminUser = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role'         => 'admin',
        ]);
        $this->fulfillOnboarding($this->workspace->id);

        // Schedule: segunda a sexta 08:00-18:00
        foreach ([1, 2, 3, 4, 5] as $weekday) {
            ProfessionalSchedule::create([
                'workspace_id'    => $this->workspace->id,
                'professional_id' => $this->professional->id,
                'weekday'         => $weekday,
                'start_time'      => '08:00',
                'end_time'        => '18:00',
                'is_active'       => true,
            ]);
        }

        $this->testDate = Carbon::parse('next monday')->format('Y-m-d');

        // Appointment existente para testes de reschedule do portal
        $this->existingAppointment = Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $this->customer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'starts_at'       => Carbon::parse("{$this->testDate} 09:00"),
            'ends_at'         => Carbon::parse("{$this->testDate} 10:00"),
            'status'          => 'scheduled',
        ]);
    }

    // -------------------------------------------------------------------------
    // Helpers

    private function postPublicStore(string $startTime): \Illuminate\Testing\TestResponse
    {
        return $this->postJson(
            route('portal.scheduling.book', $this->workspace->slug),
            [
                'service_id'      => $this->service->id,
                'professional_id' => $this->professional->id,
                'start_time'      => $startTime,
                'name'            => 'Test User',
                'phone'           => '11999990000',
            ]
        );
    }

    private function putPortalReschedule(string $startTime): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->customer, 'customer')
            ->put(
                route('portal.appointments.reschedule', [$this->workspace->slug, $this->existingAppointment->id]),
                ['start_time' => $startTime]
            );
    }

    private function postAdminStore(string $startsAt, string $endsAt): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->adminUser)
            ->from(route('agenda'))
            ->post(route('agenda.store'), [
                'customer_id'     => $this->customer->id,
                'service_id'      => $this->service->id,
                'professional_id' => $this->professional->id,
                'starts_at'       => $startsAt,
                'ends_at'         => $endsAt,
                'status'          => 'scheduled',
            ]);
    }

    // -------------------------------------------------------------------------
    // Testes de paridade

    public function test_holiday_blocks_all_channels(): void
    {
        Holiday::create([
            'workspace_id'    => $this->workspace->id,
            'name'            => 'Feriado Parity',
            'date'            => $this->testDate,
            'professional_id' => null,
            'repeats_yearly'  => false,
        ]);

        $slot    = "{$this->testDate} 14:00";
        $slotEnd = "{$this->testDate} 15:00";

        // Canal público — store()
        $this->postPublicStore($slot)->assertStatus(409);

        // Canal portal — reschedule()
        $this->putPortalReschedule($slot)
            ->assertStatus(200)
            ->assertJson(['ok' => false]);

        // Canal admin — store()
        $this->postAdminStore($slot, $slotEnd)
            ->assertRedirect(route('agenda'))
            ->assertSessionHasErrors(['starts_at']);
    }

    public function test_break_blocks_all_channels(): void
    {
        ProfessionalSchedule::where('professional_id', $this->professional->id)
            ->where('weekday', Carbon::parse($this->testDate)->dayOfWeek)
            ->update(['break_start' => '12:00', 'break_end' => '13:00']);

        $slot    = "{$this->testDate} 12:00";
        $slotEnd = "{$this->testDate} 13:00";

        $this->postPublicStore($slot)->assertStatus(409);

        $this->putPortalReschedule($slot)
            ->assertStatus(200)
            ->assertJson(['ok' => false]);

        $this->postAdminStore($slot, $slotEnd)
            ->assertRedirect(route('agenda'))
            ->assertSessionHasErrors(['starts_at']);
    }

    public function test_outside_hours_blocks_all_channels(): void
    {
        $slot    = "{$this->testDate} 07:00"; // antes das 08:00
        $slotEnd = "{$this->testDate} 08:00";

        $this->postPublicStore($slot)->assertStatus(409);

        $this->putPortalReschedule($slot)
            ->assertStatus(200)
            ->assertJson(['ok' => false]);

        $this->postAdminStore($slot, $slotEnd)
            ->assertRedirect(route('agenda'))
            ->assertSessionHasErrors(['starts_at']);
    }

    public function test_buffer_blocks_slot_in_all_channels(): void
    {
        // Serviço com 30 min de buffer
        $serviceWithBuffer = Service::factory()->create([
            'workspace_id'     => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes'   => 30,
            'is_active'        => true,
        ]);

        // Appointment existente: 14:00–15:00, buffered_ends_at = 15:30
        Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $this->customer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $serviceWithBuffer->id,
            'starts_at'       => Carbon::parse("{$this->testDate} 14:00"),
            'ends_at'         => Carbon::parse("{$this->testDate} 15:00"),
            'status'          => 'scheduled',
        ]);

        // Slot às 15:10 — dentro do buffer (buffered_ends_at = 15:30)
        $slot    = "{$this->testDate} 15:10";
        $slotEnd = "{$this->testDate} 16:10";

        $this->postPublicStore($slot)->assertStatus(409);

        $this->putPortalReschedule($slot)
            ->assertStatus(200)
            ->assertJson(['ok' => false]);

        $this->postAdminStore($slot, $slotEnd)
            ->assertRedirect(route('agenda'))
            ->assertSessionHasErrors(['starts_at']);
    }

    public function test_rescheduled_status_blocks_slot_in_all_channels(): void
    {
        // Appointment com status rescheduled bloqueia o slot
        Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $this->customer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'starts_at'       => Carbon::parse("{$this->testDate} 14:00"),
            'ends_at'         => Carbon::parse("{$this->testDate} 15:00"),
            'status'          => 'rescheduled',
        ]);

        $slot    = "{$this->testDate} 14:00";
        $slotEnd = "{$this->testDate} 15:00";

        $this->postPublicStore($slot)->assertStatus(409);

        $this->putPortalReschedule($slot)
            ->assertStatus(200)
            ->assertJson(['ok' => false]);

        $this->postAdminStore($slot, $slotEnd)
            ->assertRedirect(route('agenda'))
            ->assertSessionHasErrors(['starts_at']);
    }

    public function test_completed_status_blocks_slot_in_all_channels(): void
    {
        Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $this->customer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'starts_at'       => Carbon::parse("{$this->testDate} 14:00"),
            'ends_at'         => Carbon::parse("{$this->testDate} 15:00"),
            'status'          => 'completed',
        ]);

        $slot    = "{$this->testDate} 14:00";
        $slotEnd = "{$this->testDate} 15:00";

        $this->postPublicStore($slot)->assertStatus(409);

        $this->putPortalReschedule($slot)
            ->assertStatus(200)
            ->assertJson(['ok' => false]);

        $this->postAdminStore($slot, $slotEnd)
            ->assertRedirect(route('agenda'))
            ->assertSessionHasErrors(['starts_at']);
    }

    public function test_slot_shown_by_get_availability_is_accepted_by_store(): void
    {
        // Usar uma data limpa sem nenhum appointment — terça-feira da semana
        // (o existingAppointment do setUp ocupa segunda 09:00-10:00, não afeta terça)
        $cleanDate = Carbon::parse('next tuesday')->format('Y-m-d');

        // getAvailability() na data limpa — slot alvo: 14:00 (meio do expediente, longe de qualquer conflito)
        $slots = $this->getJson(route('portal.scheduling.availability', [
            'workspace'       => $this->workspace->slug,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'date'            => $cleanDate,
        ]))->assertStatus(200)->json();

        // 14:00 deve estar na lista — schedule 08:00-18:00, service de 60 min, nenhum appointment no dia
        $this->assertContains('14:00', $slots, 'getAvailability() deve incluir 14:00 num dia sem appointments');

        // O mesmo slot deve ser aceito pelo store() com exatamente os mesmos dados
        $this->postPublicStore("{$cleanDate} 14:00")
            ->assertStatus(200)
            ->assertJson(['ok' => true]);
    }
}
