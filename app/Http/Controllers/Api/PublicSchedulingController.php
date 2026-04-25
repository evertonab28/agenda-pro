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
use Illuminate\Validation\Rule;
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
            ->whereHas('schedules', fn ($q) => $q->where('is_active', true))
            ->get();

        return response()->json($professionals);
    }

    public function getAvailability(Request $request, Workspace $workspace)
    {
        $request->validate([
            'professional_id' => ['required', 'integer'], // Allow 0 for no preference
            'service_id'      => ['required', Rule::exists('services', 'id')->where('workspace_id', $workspace->id)],
            'addon_ids'       => ['nullable', 'array'],
            'addon_ids.*'     => [Rule::exists('services', 'id')->where('workspace_id', $workspace->id)],
            'date'            => 'required|date_format:Y-m-d',
        ]);

        $service = $workspace->services()->findOrFail($request->service_id);
        $date    = Carbon::parse($request->date)->startOfDay();

        // Reject dates in the past
        if ($date->lt(now()->startOfDay())) {
            return response()->json([]);
        }

        // Reject dates beyond max_advance_days
        $maxDays = $workspace->max_advance_days ?? 90;
        if ($date->gt(now()->startOfDay()->addDays($maxDays))) {
            return response()->json([]);
        }

        $professionals = [];
        if ($request->professional_id > 0) {
            $professionals[] = $workspace->professionals()->findOrFail($request->professional_id);
        } else {
            // "No preference": Get all active professionals for this service with active schedules
            $professionals = $service->professionals()
                ->where('is_active', true)
                ->whereHas('schedules', fn ($q) => $q->where('is_active', true))
                ->get();
        }

        if (empty($professionals)) {
            return response()->json([]);
        }

        $allSlots = [];
        $weekday = $date->dayOfWeek;
        $minAdvanceHours = $workspace->min_advance_hours ?? 0;
        $earliestAllowed = now()->addHours($minAdvanceHours);

        // Addons duration
        $addons = collect();
        if ($request->addon_ids) {
            $addons = $workspace->services()->whereIn('id', $request->addon_ids)->get();
        }
        $addonDuration = $addons->sum('duration_minutes');
        
        $combinedDuration = $service->duration_minutes + $addonDuration;
        $totalDurationWithBuffer = $combinedDuration + ($service->buffer_minutes ?? 0);

        foreach ($professionals as $professional) {
            $schedule = $professional->schedules()
                ->where('weekday', $weekday)
                ->where('is_active', true)
                ->first();

            if (!$schedule) continue;

            $startTime = Carbon::parse($request->date . ' ' . $schedule->start_time);
            $endTime   = Carbon::parse($request->date . ' ' . $schedule->end_time);
            $current   = $startTime->copy();

            while ($current->copy()->addMinutes($totalDurationWithBuffer)->lte($endTime)) {
                $slotStart = $current->copy();

                if ($slotStart->gt($earliestAllowed)) {
                    $slotEnd = $slotStart->copy()->addMinutes($combinedDuration);

                    $check = $this->agendaService->isAvailable(
                        $professional->id,
                        $slotStart->toDateTimeString(),
                        $slotEnd->toDateTimeString(),
                        null,
                        $service->id
                    );

                    if ($check['available']) {
                        $allSlots[] = $slotStart->format('H:i');
                    }
                }
                // Step for next slot remains the main service duration or slot duration?
                // Usually we step by main service duration or slot_duration from settings.
                // Here it's using main service duration.
                $current->addMinutes($service->duration_minutes);
            }
        }

        // Return unique slots, sorted
        $uniqueSlots = array_unique($allSlots);
        sort($uniqueSlots);

        return response()->json($uniqueSlots);
    }

    public function store(Request $request, Workspace $workspace)
    {
        $request->validate([
            'service_id'      => ['required', Rule::exists('services', 'id')->where('workspace_id', $workspace->id)],
            'addon_ids'       => ['nullable', 'array'],
            'addon_ids.*'     => [Rule::exists('services', 'id')->where('workspace_id', $workspace->id)],
            'professional_id' => ['required', 'integer'], // Allow 0
            'start_time'      => 'required|date_format:Y-m-d H:i',
            'name'            => 'required|string|max:255',
            'email'           => 'nullable|email|max:255',
            'phone'           => 'required|string|max:20',
        ]);

        $service   = $workspace->services()->findOrFail($request->service_id);
        $addons    = $request->addon_ids ? $workspace->services()->whereIn('id', $request->addon_ids)->get() : collect();
        
        $totalDuration = $service->duration_minutes + $addons->sum('duration_minutes');
        $totalPrice    = $service->price + $addons->sum('price');

        $startTime = Carbon::parse($request->start_time);
        $endTime   = $startTime->copy()->addMinutes($totalDuration);

        // Basic boundary checks
        if ($startTime->lte(now())) {
            return response()->json(['ok' => false, 'code' => 'past_time', 'message' => 'Horário no passado.'], 422);
        }

        // Find applicable professional(s)
        $targetProfessional = null;
        if ($request->professional_id > 0) {
            $targetProfessional = $workspace->professionals()->findOrFail($request->professional_id);
            
            $availability = $this->agendaService->isAvailable(
                $targetProfessional->id,
                $startTime->toDateTimeString(),
                $endTime->toDateTimeString(),
                null,
                $service->id
            );

            if (!$availability['available']) {
                return response()->json(['ok' => false, 'code' => $availability['code'], 'message' => 'Horário indisponível.'], 409);
            }
        } else {
            // "No Preference": find first available professional
            $candidates = $service->professionals()
                ->where('is_active', true)
                ->orderBy('id')
                ->get();

            foreach ($candidates as $candidate) {
                $check = $this->agendaService->isAvailable(
                    $candidate->id,
                    $startTime->toDateTimeString(),
                    $endTime->toDateTimeString(),
                    null,
                    $service->id
                );

                if ($check['available']) {
                    $targetProfessional = $candidate;
                    break;
                }
            }

            if (!$targetProfessional) {
                return response()->json(['ok' => false, 'code' => 'no_professional_available', 'message' => 'Nenhum profissional disponível para este horário.'], 409);
            }
        }

        $phoneDigits = preg_replace('/\D/', '', $request->phone);
        $customer = null;

        if ($request->email) {
            $customer = Customer::where('workspace_id', $workspace->id)->where('email', $request->email)->first();
        }
        if (!$customer && $phoneDigits) {
            $customer = Customer::where('workspace_id', $workspace->id)->where('phone', $phoneDigits)->first();
        }

        if ($customer) {
            if ($phoneDigits && $customer->phone !== $phoneDigits) {
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
            'professional_id' => $targetProfessional->id,
            'service_id'      => $service->id,
            'starts_at'       => $startTime,
            'ends_at'         => $endTime,
            'status'          => 'scheduled',
            'source'          => 'public_link',
            'total_price'     => $totalPrice,
        ]);

        // Create Snapshot Items
        $appointment->items()->create([
            'service_id'       => $service->id,
            'name'             => $service->name,
            'price'            => $service->price,
            'duration_minutes' => $service->duration_minutes,
            'is_main'          => true,
        ]);

        foreach ($addons as $addon) {
            $appointment->items()->create([
                'service_id'       => $addon->id,
                'name'             => $addon->name,
                'price'            => $addon->price,
                'duration_minutes' => $addon->duration_minutes,
                'is_main'          => false,
            ]);
        }

        return response()->json([
            'ok'             => true,
            'message'        => 'Agendamento realizado com sucesso. Guarde os dados para referência.',
            'appointment_id' => $appointment->id,
        ]);
    }
}
