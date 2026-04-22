<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\Professional;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Customer;
use App\Services\AgendaService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PublicSchedulingController extends Controller
{
    public function __construct(private AgendaService $agendaService) {}
    public function getServices(Workspace $workspace)
    {
        $services = $workspace->services()->where('is_active', true)->get();
        return response()->json($services);
    }

    public function getProfessionals(Workspace $workspace, $service_id)
    {
        $service = $workspace->services()->findOrFail($service_id);

        $professionals = $service->professionals()
            ->where('is_active', true)
            ->get();

        return response()->json($professionals);
    }

    public function getAvailability(Request $request, Workspace $workspace)
    {
        $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'service_id' => 'required|exists:services,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        $professional = $workspace->professionals()->findOrFail($request->professional_id);
        $service = $workspace->services()->findOrFail($request->service_id);
        $date = Carbon::parse($request->date);

        $weekday = $date->dayOfWeek;

        $schedule = $professional->schedules()
            ->where('weekday', $weekday)
            ->where('is_active', true)
            ->first();

        if (!$schedule) {
            return response()->json([]);
        }

        $slots = [];
        $startTime = Carbon::parse($request->date . ' ' . $schedule->start_time);
        $endTime = Carbon::parse($request->date . ' ' . $schedule->end_time);
        $duration = $service->duration_minutes + ($service->buffer_minutes ?? 0);

        // Fetch existing appointments for the day
        $existing = Appointment::where('professional_id', $professional->id)
            ->whereDate('starts_at', $date)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->get();

        $current = $startTime->copy();
        while ($current->copy()->addMinutes($duration)->lte($endTime)) {
            $slotStart = $current->copy();
            $slotEnd = $current->copy()->addMinutes($duration);

            $inBreak = false;
            if ($schedule->break_start && $schedule->break_end) {
                $breakStart = Carbon::parse($request->date . ' ' . $schedule->break_start);
                $breakEnd = Carbon::parse($request->date . ' ' . $schedule->break_end);

                if ($slotStart->lt($breakEnd) && $slotEnd->gt($breakStart)) {
                    $inBreak = true;
                }
            }

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

            $current->addMinutes(30);
        }

        return response()->json($slots);
    }

    public function store(Request $request, Workspace $workspace)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'professional_id' => 'required|exists:professionals,id',
            'start_time' => 'required|date_format:Y-m-d H:i',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $service = $workspace->services()->findOrFail($request->service_id);
        $professional = $workspace->professionals()->findOrFail($request->professional_id);

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

        $phoneDigits = preg_replace('/\D/', '', $request->phone);

        $customer = Customer::where('workspace_id', $workspace->id)
            ->where(function($q) use ($request, $phoneDigits) {
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
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $phoneDigits,
                'is_active' => true,
            ]);
        }

        $appointment = Appointment::create([
            'workspace_id' => $workspace->id,
            'customer_id' => $customer->id,
            'professional_id' => $request->professional_id,
            'service_id' => $service->id,
            'starts_at' => $startTime,
            'ends_at' => $endTime,
            'status' => 'scheduled',
        ]);

        return response()->json([
            'ok' => true,
            'message' => 'Agendamento realizado com sucesso!',
            'appointment_id' => $appointment->id
        ]);
    }
}
