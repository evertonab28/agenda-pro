<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RescheduleAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Models\Service;
use App\Services\AgendaService;
use App\Services\AppointmentLifecycleService;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    public function __construct(
        private AgendaService $agendaService,
        private AppointmentLifecycleService $lifecycleService,
    ) {
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
        $endsAt = $startsAt->copy()->addMinutes($service->duration_minutes);

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

        if (in_array($status, ['canceled', 'completed', 'no_show'], true)) {
            $this->authorize('transition-appointment-critical');
        }

        try {
            $appointment = match ($status) {
                'confirmed' => $this->lifecycleService->confirm($appointment, $request->user()),
                'canceled' => $this->lifecycleService->cancel($appointment, null, $request->user()),
                'completed' => $this->lifecycleService->complete($appointment, $request->user()),
                'no_show' => $this->lifecycleService->markNoShow($appointment, $request->user()),
                default => tap($appointment)->update(['status' => $status]),
            };
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return $appointment->fresh()->load(['customer', 'service', 'charge']);
    }

    public function confirm(Appointment $appointment, string $token)
    {
        if (!$appointment->confirmation_token || $appointment->confirmation_token !== $token) {
            return response()->json(['message' => 'Token invalido'], 422);
        }

        $this->lifecycleService->confirm($appointment);

        return response()->json(['message' => 'Agendamento confirmado com sucesso']);
    }

    public function reschedule(RescheduleAppointmentRequest $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        try {
            $appointment = $this->lifecycleService->reschedule(
                $appointment,
                $request->validated()['starts_at'],
                $request->validated()['notes'] ?? null,
                $request->user()
            );
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return $appointment->fresh()->load(['customer', 'service', 'charge']);
    }
}
