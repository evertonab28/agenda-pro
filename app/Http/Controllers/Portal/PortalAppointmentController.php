<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PortalAppointmentController extends Controller
{
    /**
     * Cancel an appointment
     */
    public function cancel(Workspace $workspace, $appointmentId)
    {
        $customer = Auth::guard('customer')->user();

        $appointment = Appointment::where('workspace_id', $workspace->id)
            ->where('customer_id', $customer->id)
            ->findOrFail($appointmentId);

        if ($appointment->status === 'cancelled') {
            return response()->json(['ok' => false, 'message' => 'Este agendamento já está cancelado.']);
        }

        $appointment->update(['status' => 'cancelled']);

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
        $duration = $appointment->service->duration_minutes;
        $endTime = $startTime->copy()->addMinutes($duration);

        $hasOverlap = Appointment::where('professional_id', $appointment->professional_id)
            ->where('workspace_id', $workspace->id)
            ->where('id', '!=', $appointment->id)
            ->where('status', '!=', 'cancelled')
            ->where(function($query) use ($startTime, $endTime) {
                $query->where(function($q) use ($startTime, $endTime) {
                    $q->where('starts_at', '>=', $startTime)
                      ->where('starts_at', '<', $endTime);
                })->orWhere(function($q) use ($startTime, $endTime) {
                    $q->where('ends_at', '>', $startTime)
                      ->where('ends_at', '<=', $endTime);
                });
            })->exists();

        if ($hasOverlap) {
            return response()->json([
                'ok' => false,
                'message' => 'Desculpe, este horário acabou de ser ocupado. Por favor, escolha outro.'
            ]);
        }

        $appointment->update([
            'starts_at' => $startTime,
            'ends_at' => $endTime,
            'status' => 'scheduled'
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Agendamento reagendado com sucesso.'
        ]);
    }
}
