# Scheduling Engine — Fonte Soberana de Disponibilidade

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer todos os canais (público, portal, admin) usarem `AgendaService::isAvailable()` como única fonte de decisão de disponibilidade, garantindo que a mesma entrada produza a mesma resposta em qualquer canal.

**Architecture:** Patch incremental em 4 etapas de menor para maior risco: (1) adicionar `code` ao retorno da engine existente, (2) fechar o `store()` público, (3) corrigir o `reschedule()` do portal com proteção prévia do teste de regressão, (4) alinhar `getAvailability()`. Nenhuma nova classe criada.

**Tech Stack:** PHP 8.2, Laravel 11, `AgendaService` (já existe), PHPUnit 11, Carbon, Eloquent

---

## File Map

| Arquivo | Ação |
|---------|------|
| `app/Services/AgendaService.php` | Modificar — adicionar `code` nos retornos de `isAvailable()` |
| `app/Http/Controllers/Api/PublicSchedulingController.php` | Modificar — injetar `AgendaService`, chamar em `store()` e substituir loop em `getAvailability()` |
| `app/Http/Controllers/Portal/PortalAppointmentController.php` | Modificar — injetar `AgendaService`, substituir query manual em `reschedule()` |
| `tests/Feature/Portal/PortalAppointmentTest.php` | Modificar — adicionar `ProfessionalSchedule` no setUp + 4 testes novos |
| `tests/Feature/Portal/PublicBookingValidationTest.php` | Criar — 6 testes do `store()` público |
| `tests/Feature/Scheduling/ChannelParityTest.php` | Criar — 7 testes de paridade entre canais |

---

## Task 1: Adicionar `code` ao retorno de `isAvailable()`

**Files:**
- Modify: `app/Services/AgendaService.php`

Estado atual de `isAvailable()` — os 5 pontos de retorno `false`:
- Linha ~99: conflito com buffer
- Linha ~122: feriado
- Linha ~132: sem schedule no dia
- Linha ~139: fora do expediente
- Linha ~148: break

- [ ] **Step 1: Aplicar a mudança em `AgendaService::isAvailable()`**

Abrir `app/Services/AgendaService.php`. Substituir o método `isAvailable()` completo (linhas 85–153) por:

```php
public function isAvailable(int $professionalId, string $startsAt, string $endsAt, $excludeId = null, int $serviceId = null): array
{
    $start = Carbon::parse($startsAt);
    $end = Carbon::parse($endsAt);
    $date = $start->toDateString();
    $weekday = $start->dayOfWeek;

    $serviceBuffer = 0;
    if ($serviceId) {
        $serviceBuffer = Service::where('id', $serviceId)->value('buffer_minutes') ?? 0;
    }

    // 1. Check existing conflicts (including buffers)
    if ($this->hasConflict($professionalId, $startsAt, $endsAt, $excludeId, $serviceBuffer)) {
        return ['available' => false, 'code' => 'overlap_detected', 'message' => 'O horário (incluindo o intervalo de limpeza/buffer) coincide com outro agendamento.'];
    }

    // 2. Check Holidays/Blocked dates
    $isHoliday = \App\Models\Holiday::where(function ($q) use ($date, $professionalId) {
            $q->where('date', $date)
                ->where(function ($sq) use ($professionalId) {
                    $sq->whereNull('professional_id')
                        ->orWhere('professional_id', $professionalId);
                });
        })
        ->orWhere(function ($q) use ($start, $professionalId) {
            $q->where('repeats_yearly', true)
                ->whereMonth('date', $start->month)
                ->whereDay('date', $start->day)
                ->where(function ($sq) use ($professionalId) {
                    $sq->whereNull('professional_id')
                        ->orWhere('professional_id', $professionalId);
                });
        })
        ->exists();

    if ($isHoliday) {
        return ['available' => false, 'code' => 'holiday', 'message' => 'Data bloqueada ou feriado.'];
    }

    // 3. Check Weekly Schedule
    $schedule = \App\Models\ProfessionalSchedule::where('professional_id', $professionalId)
        ->where('weekday', $weekday)
        ->where('is_active', true)
        ->first();

    if (!$schedule) {
        return ['available' => false, 'code' => 'no_schedule', 'message' => 'O profissional não atende neste dia.'];
    }

    $open = Carbon::parse($date . ' ' . $schedule->start_time);
    $close = Carbon::parse($date . ' ' . $schedule->end_time);

    if ($start->lt($open) || $end->gt($close)) {
        return ['available' => false, 'code' => 'outside_working_hours', 'message' => "Fora do horário de expediente ({$schedule->start_time} - {$schedule->end_time})."];
    }

    // 4. Check Breaks
    if ($schedule->break_start && $schedule->break_end) {
        $breakStart = Carbon::parse($date . ' ' . $schedule->break_start);
        $breakEnd = Carbon::parse($date . ' ' . $schedule->break_end);

        if ($start->lt($breakEnd) && $end->gt($breakStart)) {
            return ['available' => false, 'code' => 'break_conflict', 'message' => "Horário coincide com o intervalo ({$schedule->break_start} - {$schedule->break_end})."];
        }
    }

    return ['available' => true];
}
```

- [ ] **Step 2: Rodar a suite completa para confirmar zero regressões**

```bash
cd d:/saas/agenda-pro && php artisan test 2>&1 | tail -5
```

Saída esperada: `Tests: N passed` — mesmo número de antes, zero falhas.

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add app/Services/AgendaService.php && git commit -m "feat(scheduling): adicionar code ao retorno de isAvailable() — backward compatible"
```

---

## Task 2: Testes do `store()` público — escrever ANTES da implementação

**Files:**
- Create: `tests/Feature/Portal/PublicBookingValidationTest.php`

- [ ] **Step 1: Criar o arquivo de testes**

```php
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
```

- [ ] **Step 2: Rodar os testes e confirmar que TODOS falham (exceto `test_public_store_accepts_valid_slot` que pode passar)**

```bash
cd d:/saas/agenda-pro && php artisan test --filter PublicBookingValidationTest 2>&1
```

Saída esperada: `test_public_store_accepts_valid_slot` → PASS (o `store()` atual cria sem validar).
Os 5 testes de rejeição → FAIL (o `store()` atual não rejeita nada, retorna 200).

- [ ] **Step 3: Commit dos testes**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Portal/PublicBookingValidationTest.php && git commit -m "test(scheduling): testes de validação do store() público — TDD antes da implementação"
```

---

## Task 3: Implementar validação em `PublicSchedulingController::store()`

**Files:**
- Modify: `app/Http/Controllers/Api/PublicSchedulingController.php`

Estado atual do `store()` (linhas 100–161): valida request, busca service e professional, cria customer, cria appointment. Sem nenhuma chamada a `isAvailable()`.

- [ ] **Step 1: Adicionar injeção de `AgendaService` e chamada a `isAvailable()` no `store()`**

Abrir `app/Http/Controllers/Api/PublicSchedulingController.php`.

Adicionar o import no topo (após os imports existentes):
```php
use App\Services\AgendaService;
```

Adicionar construtor após a declaração da classe `PublicSchedulingController extends Controller {`:
```php
public function __construct(private AgendaService $agendaService) {}
```

Dentro do método `store()`, **após** as linhas que buscam `$service` e `$professional` (após `$professional = $workspace->professionals()->findOrFail($request->professional_id);`) e **antes** do bloco de criação de `$customer`, adicionar:

```php
$startTime = Carbon::parse($request->start_time);
$endTime = $startTime->copy()->addMinutes($service->duration_minutes);

$availability = $this->agendaService->isAvailable(
    $professional->id,
    $startTime->toDateTimeString(),
    $endTime->toDateTimeString(),
    null,
    $service->id
);

if (!$availability['available']) {
    return response()->json([
        'ok'      => false,
        'code'    => $availability['code'],
        'message' => 'Esse horário não está mais disponível. Escolha outro horário.',
    ], 409);
}
```

**Atenção:** o `store()` atual calcula `$startTime` e `$endTime` dentro do bloco de criação do appointment. Após essa mudança, `$startTime` e `$endTime` já estarão definidos antes desse bloco — remover a re-declaração duplicada dentro do bloco se existir.

O estado completo do `store()` após a mudança:

```php
public function store(Request $request, Workspace $workspace)
{
    $request->validate([
        'service_id'      => 'required|exists:services,id',
        'professional_id' => 'required|exists:professionals,id',
        'start_time'      => 'required|date_format:Y-m-d H:i',
        'name'            => 'required|string|max:255',
        'email'           => 'nullable|email|max:255',
        'phone'           => 'required|string|max:20',
    ]);

    $service      = $workspace->services()->findOrFail($request->service_id);
    $professional = $workspace->professionals()->findOrFail($request->professional_id);

    $startTime = Carbon::parse($request->start_time);
    $endTime   = $startTime->copy()->addMinutes($service->duration_minutes);

    $availability = $this->agendaService->isAvailable(
        $professional->id,
        $startTime->toDateTimeString(),
        $endTime->toDateTimeString(),
        null,
        $service->id
    );

    if (!$availability['available']) {
        return response()->json([
            'ok'      => false,
            'code'    => $availability['code'],
            'message' => 'Esse horário não está mais disponível. Escolha outro horário.',
        ], 409);
    }

    $phoneDigits = preg_replace('/\D/', '', $request->phone);

    $customer = Customer::where('workspace_id', $workspace->id)
        ->where(function ($q) use ($request, $phoneDigits) {
            if ($request->email) {
                $q->where('email', $request->email);
                if ($phoneDigits) {
                    $q->orWhere('phone', $phoneDigits);
                }
            } else {
                $q->where('phone', $phoneDigits);
            }
        })->first();

    if ($customer) {
        if (empty($customer->phone) || $customer->phone !== $phoneDigits) {
            $customer->update(['phone' => $phoneDigits]);
        }
    } else {
        $customer = Customer::create([
            'workspace_id' => $workspace->id,
            'name'         => $request->name,
            'email'        => $request->email,
            'phone'        => $phoneDigits,
            'is_active'    => true,
        ]);
    }

    $appointment = Appointment::create([
        'workspace_id'    => $workspace->id,
        'customer_id'     => $customer->id,
        'professional_id' => $request->professional_id,
        'service_id'      => $service->id,
        'starts_at'       => $startTime,
        'ends_at'         => $endTime,
        'status'          => 'scheduled',
    ]);

    return response()->json([
        'ok'             => true,
        'message'        => 'Agendamento realizado com sucesso!',
        'appointment_id' => $appointment->id,
    ]);
}
```

- [ ] **Step 2: Rodar os testes de PublicBookingValidation**

```bash
cd d:/saas/agenda-pro && php artisan test --filter PublicBookingValidationTest 2>&1
```

Saída esperada: 6 passed.

- [ ] **Step 3: Rodar a suite completa para confirmar sem regressões**

```bash
cd d:/saas/agenda-pro && php artisan test 2>&1 | tail -5
```

Saída esperada: todos passando, zero falhas novas.

- [ ] **Step 4: Commit**

```bash
cd d:/saas/agenda-pro && git add app/Http/Controllers/Api/PublicSchedulingController.php && git commit -m "fix(scheduling): store() público agora valida disponibilidade via isAvailable()"
```

---

## Task 4: Proteger o teste de regressão do portal antes de alterar `reschedule()`

**Files:**
- Modify: `tests/Feature/Portal/PortalAppointmentTest.php`

O problema: `test_customer_can_reschedule_own_appointment` usa `next tuesday 14:00` mas o setUp não cria `ProfessionalSchedule`. Após a Task 5 (que substitui a query manual por `isAvailable()`), esse teste vai falhar com `ok: false` porque `isAvailable()` retornará `no_schedule`. Precisa ser corrigido ANTES da Task 5.

- [ ] **Step 1: Adicionar `ProfessionalSchedule` no setUp de `PortalAppointmentTest`**

Abrir `tests/Feature/Portal/PortalAppointmentTest.php`.

Adicionar o import no topo:
```php
use App\Models\ProfessionalSchedule;
```

No método `setUp()`, **após** as linhas que criam `$this->service` e `$this->appointment`, adicionar:

```php
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
```

- [ ] **Step 2: Confirmar que os testes existentes ainda passam (antes de qualquer mudança em `reschedule()`)**

```bash
cd d:/saas/agenda-pro && php artisan test --filter PortalAppointmentTest 2>&1
```

Saída esperada: todos os testes existentes passando (4 testes: cancel, cancel-other, reschedule, reschedule-overlap).

- [ ] **Step 3: Commit da correção preventiva**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Portal/PortalAppointmentTest.php && git commit -m "test(portal): adicionar ProfessionalSchedule no setUp — preparação para Task 5"
```

---

## Task 5: Implementar `isAvailable()` em `PortalAppointmentController::reschedule()`

**Files:**
- Modify: `app/Http/Controllers/Portal/PortalAppointmentController.php`

Estado atual de `reschedule()` (linhas 40–88): calcula `$startTime`/`$endTime`, faz query manual de overlap com `starts_at`/`ends_at` (sem `buffered_ends_at`), exclui só `canceled`, sem verificação de feriado/expediente/break.

- [ ] **Step 1: Substituir query manual por `isAvailable()`**

Abrir `app/Http/Controllers/Portal/PortalAppointmentController.php`.

Adicionar imports no topo:
```php
use App\Services\AgendaService;
```

Substituir a declaração da classe por:
```php
class PortalAppointmentController extends Controller
{
    public function __construct(private AgendaService $agendaService) {}
```

Substituir o método `reschedule()` completo por:

```php
public function reschedule(Workspace $workspace, $appointmentId, Request $request)
{
    $request->validate([
        'start_time' => 'required|date_format:Y-m-d H:i',
    ]);

    $customer = Auth::guard('customer')->user();

    $appointment = Appointment::where('workspace_id', $workspace->id)
        ->where('customer_id', $customer->id)
        ->with(['service', 'professional'])
        ->findOrFail($appointmentId);

    $startTime = Carbon::parse($request->start_time);
    $endTime   = $startTime->copy()->addMinutes($appointment->service->duration_minutes);

    $availability = $this->agendaService->isAvailable(
        $appointment->professional_id,
        $startTime->toDateTimeString(),
        $endTime->toDateTimeString(),
        $appointment->id,
        $appointment->service_id
    );

    if (!$availability['available']) {
        return response()->json([
            'ok'      => false,
            'message' => 'Desculpe, este horário não está disponível. Por favor, escolha outro.',
        ]);
    }

    $appointment->update([
        'starts_at' => $startTime,
        'ends_at'   => $endTime,
        'status'    => 'scheduled',
    ]);

    return response()->json([
        'ok'      => true,
        'message' => 'Agendamento reagendado com sucesso.',
    ]);
}
```

- [ ] **Step 2: Rodar os testes do portal**

```bash
cd d:/saas/agenda-pro && php artisan test --filter PortalAppointmentTest 2>&1
```

Saída esperada: 4 testes passando. Se `test_customer_can_reschedule_own_appointment` falhar, verificar se `ProfessionalSchedule` foi criado para `next tuesday` no setUp (Task 4).

- [ ] **Step 3: Rodar a suite completa**

```bash
cd d:/saas/agenda-pro && php artisan test 2>&1 | tail -5
```

Saída esperada: todos passando.

- [ ] **Step 4: Commit**

```bash
cd d:/saas/agenda-pro && git add app/Http/Controllers/Portal/PortalAppointmentController.php && git commit -m "fix(scheduling): reschedule() portal substitui query manual por isAvailable()"
```

---

## Task 6: Expandir `PortalAppointmentTest` com testes de buffer, feriado, expediente e break

**Files:**
- Modify: `tests/Feature/Portal/PortalAppointmentTest.php`

- [ ] **Step 1: Adicionar 4 testes novos ao arquivo**

Adicionar os métodos abaixo ao final da classe `PortalAppointmentTest` (antes do `}`):

```php
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
```

Adicionar também o import de `Holiday` no topo do arquivo (se não existir):
```php
use App\Models\Holiday;
```

- [ ] **Step 2: Rodar os testes do portal**

```bash
cd d:/saas/agenda-pro && php artisan test --filter PortalAppointmentTest 2>&1
```

Saída esperada: 8 testes passando (4 originais + 4 novos).

- [ ] **Step 3: Commit**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Portal/PortalAppointmentTest.php && git commit -m "test(portal): cobertura de buffer, feriado, expediente e break no reschedule"
```

---

## Task 7: Alinhar `getAvailability()` com `isAvailable()`

**Files:**
- Modify: `app/Http/Controllers/Api/PublicSchedulingController.php`

**Atenção de performance:** Esta mudança troca ~3 queries totais por ~3 queries por slot. Para um dia com 16 slots: ~48 queries. Aceitável para uso interativo. Se for necessário otimizar no futuro, o caminho é extrair um método em `AgendaService` que receba `$schedule` e `$holidays` pré-carregados.

- [ ] **Step 1: Reescrever o loop de slots em `getAvailability()`**

Abrir `app/Http/Controllers/Api/PublicSchedulingController.php`.

O método `getAvailability()` atual (linhas 33–98) mantém a estrutura de buscar schedule e montar `$startTime`/`$endTime` do loop. A mudança é apenas dentro do loop `while`.

Substituir o conteúdo do método `getAvailability()` por:

```php
public function getAvailability(Request $request, Workspace $workspace)
{
    $request->validate([
        'professional_id' => 'required|exists:professionals,id',
        'service_id'      => 'required|exists:services,id',
        'date'            => 'required|date_format:Y-m-d',
    ]);

    $professional = $workspace->professionals()->findOrFail($request->professional_id);
    $service      = $workspace->services()->findOrFail($request->service_id);
    $date         = Carbon::parse($request->date);
    $weekday      = $date->dayOfWeek;

    $schedule = $professional->schedules()
        ->where('weekday', $weekday)
        ->where('is_active', true)
        ->first();

    if (!$schedule) {
        return response()->json([]);
    }

    $duration  = $service->duration_minutes + ($service->buffer_minutes ?? 0);
    $startTime = Carbon::parse($request->date . ' ' . $schedule->start_time);
    $endTime   = Carbon::parse($request->date . ' ' . $schedule->end_time);
    $slots     = [];
    $current   = $startTime->copy();

    while ($current->copy()->addMinutes($duration)->lte($endTime)) {
        $slotStart = $current->copy();
        $slotEnd   = $slotStart->copy()->addMinutes($duration);

        if ($slotStart->gt(now())) {
            $check = $this->agendaService->isAvailable(
                $professional->id,
                $slotStart->toDateTimeString(),
                $slotEnd->toDateTimeString(),
                null,
                $service->id
            );

            if ($check['available']) {
                $slots[] = $slotStart->format('H:i');
            }
        }

        $current->addMinutes(30);
    }

    return response()->json($slots);
}
```

- [ ] **Step 2: Rodar os testes de scheduling existentes**

```bash
cd d:/saas/agenda-pro && php artisan test --filter SchedulingTest 2>&1
```

Saída esperada: todos passando. Se `test_can_fetch_availability` falhar, verificar se o setUp de `SchedulingTest` cria `ProfessionalSchedule` com os horários corretos (ele cria weekday=1 com 09:00–12:00, o que já cobre `next monday`).

- [ ] **Step 3: Rodar a suite completa**

```bash
cd d:/saas/agenda-pro && php artisan test 2>&1 | tail -5
```

Saída esperada: todos passando.

- [ ] **Step 4: Commit**

```bash
cd d:/saas/agenda-pro && git add app/Http/Controllers/Api/PublicSchedulingController.php && git commit -m "fix(scheduling): getAvailability() usa isAvailable() por slot — paridade com store()"
```

---

## Task 8: Testes de paridade entre canais

**Files:**
- Create: `tests/Feature/Scheduling/ChannelParityTest.php`

- [ ] **Step 1: Criar o arquivo**

```php
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
```

- [ ] **Step 2: Rodar os testes de paridade**

```bash
cd d:/saas/agenda-pro && php artisan test --filter ChannelParityTest 2>&1
```

Saída esperada: 7 passed.

- [ ] **Step 3: Rodar a suite completa**

```bash
cd d:/saas/agenda-pro && php artisan test 2>&1 | tail -5
```

Saída esperada: todos passando.

- [ ] **Step 4: Commit**

```bash
cd d:/saas/agenda-pro && git add tests/Feature/Scheduling/ChannelParityTest.php && git commit -m "test(scheduling): paridade entre canais — mesma entrada, mesma decisão nos 3 canais"
```

---

## Task 9: Validação final

**Files:** nenhum — apenas verificação

- [ ] **Step 1: Rodar a suite completa**

```bash
cd d:/saas/agenda-pro && php artisan test 2>&1 | tail -10
```

Saída esperada: todos os testes passando, zero falhas.

- [ ] **Step 2: Verificar os critérios de aceite da sprint**

Checar cada item:

- `isAvailable()` tem `code` em todos os retornos negativos — Task 1 ✓
- `store()` público rejeita com 409 + `code` — Task 3 ✓
- `reschedule()` portal usa `isAvailable()` — Task 5 ✓
- `getAvailability()` usa `isAvailable()` por slot — Task 7 ✓
- Slot em feriado bloqueado nos 3 canais — Task 8 ✓
- Slot com buffer bloqueado nos 3 canais — Task 8 ✓
- `rescheduled` e `completed` bloqueiam slot nos 3 canais — Task 8 ✓
- `test_customer_can_reschedule_own_appointment` verde — Task 4 ✓
- Slot de `getAvailability()` é aceito por `store()` — Task 8 ✓

- [ ] **Step 3: Verificar commits desta sprint**

```bash
cd d:/saas/agenda-pro && git log --oneline -15 2>&1
```

Conferir que todos os commits das Tasks 1–8 estão presentes.
