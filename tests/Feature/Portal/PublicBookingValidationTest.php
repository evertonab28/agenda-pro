<?php

namespace Tests\Feature\Portal;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Holiday;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Service;
use App\Models\Workspace;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicBookingValidationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected Professional $professional;
    protected Service $service;
    protected string $validDate;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace   = Workspace::factory()->create(['slug' => 'pub-test']);
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

        // Schedule: segunda a sexta, 08:00–18:00, sem break
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

        // Próxima segunda
        $this->validDate = Carbon::parse('next monday')->format('Y-m-d');
    }

    private function bookPayload(string $date, string $time): array
    {
        return [
            'service_id'      => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time'      => "{$date} {$time}",
            'name'            => 'Test User',
            'phone'           => '11999990000',
        ];
    }

    public function test_public_store_accepts_valid_slot(): void
    {
        $response = $this->postJson(
            route('portal.scheduling.book', $this->workspace->slug),
            $this->bookPayload($this->validDate, '10:00')
        );

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
        $this->assertEquals(1, Appointment::count());
    }

    public function test_public_store_rejects_holiday_slot(): void
    {
        Holiday::create([
            'workspace_id'    => $this->workspace->id,
            'name'            => 'Feriado Teste',
            'date'            => $this->validDate,
            'professional_id' => null,
            'repeats_yearly'  => false,
        ]);

        $response = $this->postJson(
            route('portal.scheduling.book', $this->workspace->slug),
            $this->bookPayload($this->validDate, '10:00')
        );

        $response->assertStatus(409);
        $response->assertJson(['ok' => false, 'code' => 'holiday']);
        $this->assertEquals(0, Appointment::count());
    }

    public function test_public_professionals_returns_empty_when_service_has_no_professional(): void
    {
        $unlinkedService = Service::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_active' => true,
        ]);

        $response = $this->getJson(route('portal.scheduling.professionals', [$this->workspace->slug, $unlinkedService->id]));

        $response->assertStatus(200);
        $response->assertExactJson([]);
    }

    public function test_public_store_rejects_slot_outside_working_hours(): void
    {
        $response = $this->postJson(
            route('portal.scheduling.book', $this->workspace->slug),
            $this->bookPayload($this->validDate, '07:00') // antes das 08:00
        );

        $response->assertStatus(409);
        $response->assertJson(['ok' => false, 'code' => 'outside_working_hours']);
        $this->assertEquals(0, Appointment::count());
    }

    public function test_public_store_rejects_double_booking(): void
    {
        // Criar appointment existente às 10:00
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $customer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $this->service->id,
            'starts_at'       => Carbon::parse("{$this->validDate} 10:00"),
            'ends_at'         => Carbon::parse("{$this->validDate} 11:00"),
            'status'          => 'scheduled',
        ]);

        // Tentar agendar no mesmo horário
        $response = $this->postJson(
            route('portal.scheduling.book', $this->workspace->slug),
            $this->bookPayload($this->validDate, '10:00')
        );

        $response->assertStatus(409);
        $response->assertJson(['ok' => false, 'code' => 'overlap_detected']);
        $response->assertJson([
            'message' => 'Esse horário acabou de ficar indisponível. Atualizamos a lista para você escolher outro.',
        ]);
        $this->assertEquals(1, Appointment::count()); // só o original
    }

    public function test_public_store_rejects_slot_blocked_by_buffer(): void
    {
        // Serviço com 15 min de buffer
        $serviceWithBuffer = Service::factory()->create([
            'workspace_id'     => $this->workspace->id,
            'duration_minutes' => 60,
            'buffer_minutes'   => 15,
            'is_active'        => true,
        ]);

        // Appointment existente: 10:00–11:00, buffered_ends_at = 11:15
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        Appointment::create([
            'workspace_id'    => $this->workspace->id,
            'customer_id'     => $customer->id,
            'professional_id' => $this->professional->id,
            'service_id'      => $serviceWithBuffer->id,
            'starts_at'       => Carbon::parse("{$this->validDate} 10:00"),
            'ends_at'         => Carbon::parse("{$this->validDate} 11:00"),
            'status'          => 'scheduled',
        ]);

        // Slot às 11:05 deve ser bloqueado pelo buffer (buffered_ends_at = 11:15)
        $response = $this->postJson(
            route('portal.scheduling.book', $this->workspace->slug),
            $this->bookPayload($this->validDate, '11:05')
        );

        $response->assertStatus(409);
        $response->assertJson(['ok' => false, 'code' => 'overlap_detected']);
        $this->assertEquals(1, Appointment::count()); // only the existing appointment, none created
    }

    public function test_public_store_rejects_slot_in_break(): void
    {
        // Adicionar break ao schedule de segunda
        ProfessionalSchedule::where('professional_id', $this->professional->id)
            ->where('weekday', Carbon::parse($this->validDate)->dayOfWeek)
            ->update(['break_start' => '12:00', 'break_end' => '13:00']);

        $response = $this->postJson(
            route('portal.scheduling.book', $this->workspace->slug),
            $this->bookPayload($this->validDate, '12:00')
        );

        $response->assertStatus(409);
        $response->assertJson(['ok' => false, 'code' => 'break_conflict']);
        $this->assertEquals(0, Appointment::count());
    }
}
