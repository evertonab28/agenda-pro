<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\Professional;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Customer;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PublicSchedulingController extends Controller
{
    public function getServices(Clinic $clinic)
    {
        
        $services = Service::where('is_active', true)
            ->whereHas('professionals', function($q) use ($clinic) {
                // Assuming services belong to clinic via professionals or direct clinic_id
                // In my case, I'll filter by those that have active professionals in this clinic context
                // If there's no direct clinic_id on Service, we use professional relationship
            })->get();

        // Fallback: If services have clinic_id (which they should in multi-tenant)
        $services = Service::where('is_active', true)->get();

        return response()->json($services);
    }

    public function getProfessionals(Clinic $clinic, $service_id)
    {
        $service = Service::findOrFail($service_id);

        $professionals = $service->professionals()
            ->where('is_active', true)
            ->get();

        return response()->json($professionals);
    }

    public function getAvailability(Request $request, Clinic $clinic)
    {
        $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'service_id' => 'required|exists:services,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        $professional = Professional::findOrFail($request->professional_id);
        $service = Service::findOrFail($request->service_id);
        $date = Carbon::parse($request->date);
        
        $weekday = $date->dayOfWeek; // 0 (Sun) to 6 (Sat)
        // Adjust for my model (if weekday starts at 1 for Monday or 0 for Sunday)
        // ProfessionalSchedule common: 1=Mon, 2=Tue... 6=Sat, 0=Sun (matching dayOfWeek)

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

            // Check break
            $inBreak = false;
            if ($schedule->break_start && $schedule->break_end) {
                $breakStart = Carbon::parse($request->date . ' ' . $schedule->break_start);
                $breakEnd = Carbon::parse($request->date . ' ' . $schedule->break_end);
                
                if ($slotStart->lt($breakEnd) && $slotEnd->gt($breakStart)) {
                    $inBreak = true;
                }
            }

            if (!$inBreak) {
                // Check conflicts
                $conflict = $existing->first(function($apt) use ($slotStart, $slotEnd) {
                    $aptStart = Carbon::parse($apt->starts_at);
                    $aptEnd = Carbon::parse($apt->ends_at);
                    return $slotStart->lt($aptEnd) && $slotEnd->gt($aptStart);
                });

                if (!$conflict && $slotStart->gt(now())) {
                    $slots[] = $slotStart->format('H:i');
                }
            }

            $current->addMinutes(30); // Dynamic step or duration based? Using 30min step.
        }

        return response()->json($slots);
    }

    public function store(Request $request, Clinic $clinic)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'professional_id' => 'required|exists:professionals,id',
            'start_time' => 'required|date_format:Y-m-d H:i',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $service = Service::findOrFail($request->service_id);
        
        // Find or create customer
        $phoneDigits = preg_replace('/\D/', '', $request->phone);
        
        $customer = Customer::where('clinic_id', $clinic->id)
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
                'clinic_id' => $clinic->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $phoneDigits,
                'is_active' => true,
            ]);
        }

        $startTime = Carbon::parse($request->start_time);
        $endTime = $startTime->copy()->addMinutes($service->duration_minutes);

        $appointment = Appointment::create([
            'clinic_id' => $clinic->id,
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
