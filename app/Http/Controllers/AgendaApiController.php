<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgendaStoreRequest;
use App\Models\Appointment;
use App\Services\AgendaService;
use App\Services\AuditService;
use App\Enums\AppointmentStatus;
use Illuminate\Http\Request;

class AgendaApiController extends Controller
{
    public function __construct(private AgendaService $agendaService) {}

    private function formatAppointment(Appointment $appointment): array
    {
        $appointment->load(['customer', 'service', 'professional', 'charge.receipts']);
        $charge = $appointment->charge;
        $amountPaid = $charge ? $charge->receipts->sum('amount_received') : 0;

        return [
            'id'           => $appointment->id,
            'title'        => ($appointment->customer?->name ?? 'Cliente') . ' - ' . ($appointment->service?->name ?? 'Serviço'),
            'start'        => $appointment->starts_at->toIso8601String(),
            'end'          => $appointment->ends_at->toIso8601String(),
            'status'       => $appointment->status,
            'customer'     => $appointment->customer,
            'service'      => $appointment->service,
            'professional' => $appointment->professional,
            'notes'        => $appointment->notes,
            'charge'       => $charge ? [
                'id'     => $charge->id,
                'status' => $charge->status,
                'amount' => $charge->amount,
                'paid'   => $amountPaid,
            ] : null,
        ];
    }

    public function store(AgendaStoreRequest $request)
    {
        $this->authorize('create', Appointment::class);

        $data = $request->validated();
        $availability = $this->agendaService->isAvailable(
            $data['professional_id'],
            $data['starts_at'],
            $data['ends_at'],
            null,
            $data['service_id']
        );

        if (!$availability['available']) {
            return response()->json(['message' => $availability['message']], 422);
        }

        $data['status'] = AppointmentStatus::Scheduled->value;
        $appointment = Appointment::create($data);
        AuditService::log(auth()->user(), 'appointment.created', $appointment);

        return response()->json(['appointment' => $this->formatAppointment($appointment)], 201);
    }

    public function update(Request $request, Appointment $appointment, \App\Services\AppointmentLifecycleService $lifecycleService)
    {
        $this->authorize('update', $appointment);

        $data = $request->validate([
            'customer_id'     => 'sometimes|exists:customers,id',
            'service_id'      => 'sometimes|exists:services,id',
            'professional_id' => 'required|exists:professionals,id',
            'starts_at'       => 'required|date',
            'ends_at'         => 'required|date|after:starts_at',
            'notes'           => 'nullable|string',
            'status'          => 'nullable|string|in:' . implode(',', AppointmentStatus::values()),
        ]);

        $serviceId = $data['service_id'] ?? $appointment->service_id;
        $availability = $this->agendaService->isAvailable(
            $data['professional_id'],
            $data['starts_at'],
            $data['ends_at'],
            $appointment->id,
            $serviceId
        );

        if (!$availability['available']) {
            return response()->json(['message' => $availability['message']], 422);
        }

        $requestedStatus = $data['status'] ?? null;
        unset($data['status']);

        $appointment->update($data);

        if ($requestedStatus && $requestedStatus !== $appointment->fresh()->status) {
            try {
                if (in_array($requestedStatus, [
                    AppointmentStatus::Canceled->value,
                    AppointmentStatus::Completed->value,
                    AppointmentStatus::NoShow->value,
                ], true)) {
                    $this->authorize('transition-appointment-critical');
                }

                match ($requestedStatus) {
                    AppointmentStatus::Confirmed->value => $lifecycleService->confirm($appointment, $request->user()),
                    AppointmentStatus::Canceled->value => $lifecycleService->cancel($appointment, null, $request->user()),
                    AppointmentStatus::Completed->value => $lifecycleService->complete($appointment, $request->user()),
                    AppointmentStatus::NoShow->value => $lifecycleService->markNoShow($appointment, $request->user()),
                    default => null,
                };
            } catch (\DomainException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        AuditService::log(auth()->user(), 'appointment.updated', $appointment);

        return response()->json(['appointment' => $this->formatAppointment($appointment->fresh())]);
    }

    public function status(Request $request, Appointment $appointment, \App\Services\AppointmentLifecycleService $lifecycleService)
    {
        $this->authorize('update', $appointment);

        $request->validate([
            'status'        => 'required|string|in:' . implode(',', AppointmentStatus::values()),
            'cancel_reason' => 'nullable|string|max:255',
        ]);

        if (in_array($request->status, [
            AppointmentStatus::Canceled->value,
            AppointmentStatus::Completed->value,
            AppointmentStatus::NoShow->value,
        ], true)) {
            $this->authorize('transition-appointment-critical');
        }

        try {
            match ($request->status) {
                AppointmentStatus::Confirmed->value => $lifecycleService->confirm($appointment, $request->user()),
                AppointmentStatus::Canceled->value => $lifecycleService->cancel($appointment, $request->cancel_reason, $request->user()),
                AppointmentStatus::Completed->value => $lifecycleService->complete($appointment, $request->user()),
                AppointmentStatus::NoShow->value => $lifecycleService->markNoShow($appointment, $request->user()),
                default => $appointment->update(['status' => $request->status]),
            };
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['appointment' => $this->formatAppointment($appointment)]);
    }

    public function destroy(Appointment $appointment)
    {
        $this->authorize('delete', $appointment);
        AuditService::log(auth()->user(), 'appointment.deleted', $appointment);
        $appointment->delete();

        return response()->json(['ok' => true]);
    }
}
