# Sprint 2 — Scheduling Engine: Fonte Soberana de Disponibilidade

**Data:** 2026-04-22
**Sprint:** Scheduling soberano — sem nova arquitetura grande
**Escopo:** Centralizar decisão de disponibilidade em `AgendaService::isAvailable()` para todos os canais

---

## Contexto

O Agenda Pro tem quatro canais que criam ou leem disponibilidade de agendamentos:

1. **Admin/API** — `AgendaController`, `AgendaApiController`, `AppointmentController`, `WaitlistController`
2. **Público — leitura** — `PublicSchedulingController::getAvailability()`
3. **Público — escrita** — `PublicSchedulingController::store()`
4. **Portal — reagendamento** — `PortalAppointmentController::reschedule()`

Os canais 1 e 4 (waitlist) já usam `AgendaService::isAvailable()` corretamente. Os canais 2, 3 e o reagendamento (4) têm lógicas próprias divergentes — `store()` público não valida nada, `reschedule()` usa query manual sem buffer/feriado/expediente/break, e `getAvailability()` usa checks de conflito que ignoram `buffered_ends_at` e filtram status errados.

---

## Política única de conflito

Esta política vale para todos os canais a partir desta sprint:

### Status que bloqueiam um slot
- `scheduled`
- `confirmed`
- `rescheduled`
- `completed`

### Status que liberam um slot
- `canceled`
- `no_show`

### Como buffer entra
- O `buffered_ends_at` do appointment existente é comparado contra o `starts_at` do novo.
- O buffer do serviço do novo appointment (`service.buffer_minutes`) é somado ao seu próprio `ends_at` antes da comparação.
- Implementado em `AgendaService::hasConflict()` — correto como está. Nenhuma mudança necessária nesse método.

### `getAvailability()` — duração do slot
- `$duration = service.duration_minutes + (service.buffer_minutes ?? 0)` — correto como está.
- O slot exibido ao usuário já inclui o buffer como parte da "janela ocupada".

---

## Arquivos afetados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `app/Services/AgendaService.php` | Adicionar `code` no retorno de `isAvailable()` |
| `app/Http/Controllers/Api/PublicSchedulingController.php` | Chamar `isAvailable()` em `store()` e `getAvailability()` |
| `app/Http/Controllers/Portal/PortalAppointmentController.php` | Injetar `AgendaService`, substituir query manual em `reschedule()` |
| `tests/Feature/Portal/PortalAppointmentTest.php` | Adicionar `ProfessionalSchedule` no setUp para corrigir regressão |
| `tests/Feature/Scheduling/ChannelParityTest.php` | Arquivo novo — testes de paridade entre canais |
| `tests/Feature/Portal/PublicBookingValidationTest.php` | Arquivo novo — testes do `store()` público |

---

## Etapas de implementação

### Etapa 1 — Adicionar `code` ao retorno de `isAvailable()`

**Arquivo:** `app/Services/AgendaService.php`
**Risco:** zero — backward compatible, callers existentes ignoram o campo novo.

Cada `return ['available' => false, ...]` recebe um campo `code`:

| Condição | `code` |
|----------|--------|
| Conflito com buffer | `overlap_detected` |
| Feriado/data bloqueada | `holiday` |
| Profissional não atende no dia | `no_schedule` |
| Fora do expediente | `outside_working_hours` |
| Coincide com break | `break_conflict` |
| Sucesso | `code` ausente (ou omitido) |

Retorno de sucesso permanece `['available' => true]` — sem `code`.

**Critério de aceite:** `php artisan test` continua verde. Nenhum caller quebra.

---

### Etapa 2 — Fechar `PublicSchedulingController::store()` com `isAvailable()`

**Arquivo:** `app/Http/Controllers/Api/PublicSchedulingController.php`
**Risco:** baixo — adiciona rejeição onde hoje não há nenhuma. Nenhum caller legítimo que enviava slot válido é afetado.

Injetar `AgendaService` via construtor. Após buscar service e professional e antes de criar o appointment:

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
        'ok' => false,
        'code' => $availability['code'],
        'message' => 'Esse horário não está mais disponível. Escolha outro horário.',
    ], 409);
}
```

O `$endTime` no `store()` atual já é calculado como `starts_at + duration_minutes` para criar o appointment — reutilizar o mesmo valor.

**Critério de aceite:**
- POST em slot válido → 200
- POST em slot de feriado → 409 com `code: holiday`
- POST em slot fora do expediente → 409 com `code: outside_working_hours`
- POST em slot com conflito (incluindo buffer) → 409 com `code: overlap_detected`
- POST em slot em break → 409 com `code: break_conflict`
- Testes existentes de `PublicFlowSecurityTest` continuam verdes

---

### Etapa 3 — Substituir query manual em `PortalAppointmentController::reschedule()`

**Arquivo:** `app/Http/Controllers/Portal/PortalAppointmentController.php`
**Risco:** médio — o teste `test_customer_can_reschedule_own_appointment` VAI QUEBRAR se não for corrigido primeiro.

**Ação obrigatória antes desta etapa:** expandir o setUp de `PortalAppointmentTest` adicionando `ProfessionalSchedule` para o profissional nos dias usados nos testes (`next monday` e `next tuesday`). Ver seção de testes abaixo.

Injetar `AgendaService` via construtor. Substituir os ~15 linhas de query manual por:

```php
$startTime = Carbon::parse($request->start_time);
$endTime = $startTime->copy()->addMinutes($appointment->service->duration_minutes);

$availability = $this->agendaService->isAvailable(
    $appointment->professional_id,
    $startTime->toDateTimeString(),
    $endTime->toDateTimeString(),
    $appointment->id,
    $appointment->service_id
);

if (!$availability['available']) {
    return response()->json([
        'ok' => false,
        'message' => 'Desculpe, este horário não está disponível. Por favor, escolha outro.',
    ]);
}
```

**Nota:** O portal retorna 200 com `ok: false` para indisponibilidade (padrão atual). Manter esse padrão — não mudar para 409 nesta etapa para não quebrar o frontend do portal sem coordenação.

**Critério de aceite:**
- Reagendamento em slot válido → 200 `ok: true`
- Reagendamento em slot com conflito de buffer → 200 `ok: false`
- Reagendamento em feriado → 200 `ok: false`
- Reagendamento fora do expediente → 200 `ok: false`
- Reagendamento em break → 200 `ok: false`
- `test_customer_can_reschedule_own_appointment` continua verde
- `test_customer_cannot_reschedule_to_overlapping_slot` continua verde

---

### Etapa 4 — Alinhar `getAvailability()` com `isAvailable()`

**Arquivo:** `app/Http/Controllers/Api/PublicSchedulingController.php`
**Risco:** médio — mudança de comportamento visível (slots que antes eram mostrados podem sumir). O risco de performance precisa ser avaliado.

**Estratégia de performance:** Antes do loop de slots, carregar holiday e schedule uma única vez. Passar os dados pré-carregados via o próprio `isAvailable()` — que já faz as queries internamente. Como `isAvailable()` faz queries separadas para holiday, schedule e conflito por chamada, isso resulta em ~3 queries por slot.

Para um dia típico com 16 slots de 30 min: ~48 queries vs. ~3 queries atuais. Aceitável para uso interativo (o usuário seleciona uma data, o resultado chega em < 1s em banco local). Se performance for problema em produção, o próximo passo é extrair métodos que recebem os objetos pré-carregados — mas isso é dívida técnica posterior, não escopo desta sprint.

**Substituição no loop:**

Remover:
```php
// Fetch existing appointments for the day
$existing = Appointment::where(...)
    ->whereIn('status', ['scheduled', 'confirmed'])
    ->get();

// ... dentro do while:
$inBreak = false;
if ($schedule->break_start && $schedule->break_end) { ... }
if (!$inBreak) {
    $conflict = $existing->first(function($apt) use ($slotStart, $slotEnd) {
        $aptStart = Carbon::parse($apt->starts_at);
        $aptEnd = Carbon::parse($apt->ends_at);
        return $slotStart->lt($aptEnd) && $slotEnd->gt($aptStart);
    });
    if (!$conflict && $slotStart->gt(now())) {
        $slots[] = $slotStart->format('H:i');
    }
}
```

Adicionar no lugar (dentro do while, após calcular `$slotStart` e `$slotEnd`):
```php
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
```

O check `$slotStart->gt(now())` permanece antes de `isAvailable()` para evitar queries desnecessárias para slots passados.

A verificação de schedule (`if (!$schedule) return []`) antes do loop permanece — é necessária para montar `$startTime`/`$endTime` do loop. `isAvailable()` vai re-checar o schedule internamente, mas não é duplicação problemática.

**Critério de aceite:**
- `getAvailability()` não retorna slots em feriados
- `getAvailability()` não retorna slots em break
- `getAvailability()` não retorna slots bloqueados por `buffered_ends_at` de appointment existente
- `getAvailability()` não retorna slots com status `rescheduled` ou `completed` conflitantes
- Slot retornado por `getAvailability()` passa em `store()` com os mesmos dados (coerência leitura/escrita)
- `test_can_fetch_availability` em `SchedulingTest` continua verde

---

## Testes

### Testes existentes que precisam ser expandidos

**`tests/Feature/Portal/PortalAppointmentTest.php`**

Problema: `setUp()` cria professional sem `ProfessionalSchedule`. Após Etapa 3, `isAvailable()` retorna `no_schedule` para qualquer slot → todos os testes de reschedule vão falhar.

Correção no `setUp()`:
```php
use App\Models\ProfessionalSchedule;

// No setUp(), após criar professional e service:
ProfessionalSchedule::create([
    'workspace_id' => $this->workspace->id,
    'professional_id' => $this->professional->id,
    'weekday' => Carbon::parse('next monday')->dayOfWeek,
    'start_time' => '08:00',
    'end_time'   => '18:00',
    'is_active'  => true,
]);

ProfessionalSchedule::create([
    'workspace_id' => $this->workspace->id,
    'professional_id' => $this->professional->id,
    'weekday' => Carbon::parse('next tuesday')->dayOfWeek,
    'start_time' => '08:00',
    'end_time'   => '18:00',
    'is_active'  => true,
]);
```

Novos testes a adicionar em `PortalAppointmentTest`:
- `test_customer_cannot_reschedule_to_slot_blocked_by_buffer`
- `test_customer_cannot_reschedule_to_holiday`
- `test_customer_cannot_reschedule_outside_working_hours`
- `test_customer_cannot_reschedule_during_break`

---

### Arquivo novo: `tests/Feature/Portal/PublicBookingValidationTest.php`

Testes do `store()` público após Etapa 2:
- `test_public_store_rejects_holiday_slot` → 409, `code: holiday`
- `test_public_store_rejects_slot_outside_working_hours` → 409, `code: outside_working_hours`
- `test_public_store_rejects_double_booking` → 409, `code: overlap_detected`
- `test_public_store_rejects_slot_in_break` → 409, `code: break_conflict`
- `test_public_store_rejects_slot_blocked_by_buffer` → 409, `code: overlap_detected`
- `test_public_store_accepts_valid_slot` → 200

---

### Arquivo novo: `tests/Feature/Scheduling/ChannelParityTest.php`

Testes de paridade real entre canais — mesma entrada, mesma decisão:

- `test_holiday_blocks_public_store_and_portal_reschedule_and_admin` — feriado → 3 canais rejeitam
- `test_break_blocks_public_store_and_portal_reschedule_and_admin` — break → 3 canais rejeitam
- `test_outside_hours_blocks_public_store_and_portal_reschedule_and_admin` — fora do expediente → 3 canais rejeitam
- `test_buffer_blocks_slot_in_all_channels` — appointment com buffer → slot dentro do buffer é bloqueado nos 3 canais
- `test_rescheduled_status_blocks_slot_in_all_channels` — appointment `rescheduled` bloqueia o slot
- `test_completed_status_blocks_slot_in_all_channels` — appointment `completed` bloqueia o slot
- `test_slot_shown_by_get_availability_is_accepted_by_store` — slot retornado por `getAvailability()` é aceito por `store()` com os mesmos dados

---

## Riscos documentados como dívida técnica (fora do escopo desta sprint)

- **Race condition:** Dois `store()` simultâneos para o mesmo slot ainda podem criar double-booking. Mitigação real exige `SELECT FOR UPDATE`. Registrado para sprint futura.
- **Performance de `getAvailability()`:** ~48 queries por chamada após Etapa 4 vs. ~3 atuais. Aceitável para uso interativo. Se necessário, extrair `isSlotAvailable($professional, $schedule, $holidays, $slotStart, $slotEnd, $serviceId)` que recebe objetos pré-carregados — mas somente se performance for problema comprovado.
- **Timezone:** `AgendaService::isAvailable()` usa `Carbon::parse()` sem timezone explícito. Risco real se servidor e clientes estiverem em fusos diferentes.

---

## Critérios de aceite da sprint completa

- `php artisan test` verde após cada etapa
- Slot em feriado → rejeitado nos 3 canais com a mesma decisão
- Slot em break → rejeitado nos 3 canais
- Slot fora do expediente → rejeitado nos 3 canais
- Slot bloqueado por buffer → rejeitado nos 3 canais
- `rescheduled` e `completed` bloqueiam slot nos 3 canais
- Slot mostrado por `getAvailability()` é aceito por `store()` com os mesmos dados
- `test_customer_can_reschedule_own_appointment` verde
- `test_customer_cannot_reschedule_to_overlapping_slot` verde
- `test_can_fetch_availability` verde
