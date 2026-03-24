<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentStatusRequest;
use App\Http\Requests\RescheduleAppointmentRequest;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Service;
use Illuminate\Support\Str;
use Carbon\Carbon;

use App\Services\AgendaService;

class AppointmentController extends Controller
{
    private $agendaService;

    public function __construct(AgendaService $agendaService)
    {
        $this->agendaService = $agendaService;
        $this->authorizeResource(Appointment::class, 'appointment');
    }

    public function index()
    {
        return Appointment::with(['customer', 'service', 'charge'])
            ->orderBy('starts_at')
            ->paginate(20);
    }

public function store(StoreAppointmentRequest $request)
{
$data = $request->validated();
$service = Service::findOrFail($data['service_id']);

        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = (clone $startsAt)->addMinutes($service->duration_minutes);

        $availability = $this->agendaService->isAvailable(
            $data['professional_id'],
            $startsAt->toDateTimeString(),
            $endsAt->toDateTimeString(),
            null,
            $service->id
        );

        if (!$availability['available']) {
            return response()->json(['message' => $availability['message']], 422);
        }

        $appointment = Appointment::create([
            ...$data,
            'starts_at' => $startsAt->toDateTimeString(),
            'ends_at' => $endsAt->toDateTimeString(),
            'status' => 'scheduled',
            'confirmation_token' => Str::random(40),
            'public_token' => Str::random(32),
            'source' => $data['source'] ?? 'admin',
        ]);

Charge::create([
'appointment_id' => $appointment->id,
'amount' => $service->price,
'status' => 'pending',
'due_date' => $startsAt->toDateString(),
]);

return response()->json(
$appointment->load(['customer', 'service', 'charge']),
201
);
}

public function show(Appointment $appointment)
{
return $appointment->load(['customer', 'service', 'charge', 'reminders']);
}

    public function updateStatus(UpdateAppointmentStatusRequest $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);
        $status = $request->validated()['status'];

$payload = ['status' => $status];
if ($status === 'confirmed') {
$payload['confirmed_at'] = now();
}

$appointment->update($payload);

return $appointment->fresh()->load(['customer', 'service', 'charge']);
}

public function confirm(Appointment $appointment, string $token)
{
if (!$appointment->confirmation_token || $appointment->confirmation_token !== $token) {
return response()->json(['message' => 'Token inválido'], 422);
}

$appointment->update([
'status' => 'confirmed',
'confirmed_at' => now(),
]);

return response()->json(['message' => 'Agendamento confirmado com sucesso']);
}

    public function reschedule(RescheduleAppointmentRequest $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);
                $startsAt = Carbon::parse($request->validated()['starts_at']);
        $duration = $appointment->service->duration_minutes;
        $endsAt = (clone $startsAt)->addMinutes($duration);

        $availability = $this->agendaService->isAvailable(
            $appointment->professional_id,
            $startsAt->toDateTimeString(),
            $endsAt->toDateTimeString(),
            $appointment->id,
            $appointment->service_id
        );

        if (!$availability['available']) {
            return response()->json(['message' => $availability['message']], 422);
        }

        $notes = $request->validated()['notes'] ?? null;
        $mergedNotes = trim(($appointment->notes ? $appointment->notes . PHP_EOL : '') . '[REAGENDADO] ' . ($notes ?? ''));

        $appointment->update([
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => 'rescheduled',
            'notes' => $mergedNotes,
        ]);

$appointment->charge?->update([
'due_date' => $startsAt->toDateString(),
'status' => 'pending',
]);

return $appointment->fresh()->load(['customer', 'service', 'charge']);
}
}