<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Workspace;
use App\Services\AgendaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PortalAppointmentController extends Controller
{
    public function __construct(private AgendaService $agendaService) {}

    /**
     * Cancel an appointment
     */
    public function cancel(Workspace $workspace, $appointmentId)
    {
        $customer = Auth::guard('customer')->user();

        $appointment = Appointment::where('workspace_id', $workspace->id)
            ->where('customer_id', $customer->id)
            ->findOrFail($appointmentId);

        if ($appointment->status === 'canceled') {
            return response()->json(['ok' => false, 'message' => 'Este agendamento já está cancelado.']);
        }

        $appointment->update(['status' => 'canceled']);

        return response()->json([
            'ok' => true,
            'message' => 'Agendamento cancelado com sucesso.'
        ]);
    }

    /**
     * Update appointment time
     */
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
}