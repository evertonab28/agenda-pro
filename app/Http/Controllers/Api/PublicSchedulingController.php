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
            // Scoped to workspace to prevent cross-tenant enumeration
            'professional_id' => ['required', Rule::exists('professionals', 'id')->where('workspace_id', $workspace->id)],
            'service_id'      => ['required', Rule::exists('services', 'id')->where('workspace_id', $workspace->id)],
            'date'            => 'required|date_format:Y-m-d',
        ]);

        $professional = $workspace->professionals()->findOrFail($request->professional_id);
        $service      = $workspace->services()->findOrFail($request->service_id);
        $date         = Carbon::parse($request->date)->startOfDay();

        // Reject dates in the past
        if ($date->lt(now()->startOfDay())) {
            return response()->json([]);
        }

        // Reject dates beyond max_advance_days (default: 90)
        $maxDays = $workspace->max_advance_days ?? 90;
        if ($date->gt(now()->startOfDay()->addDays($maxDays))) {
            return response()->json([]);
        }

        $weekday  = $date->dayOfWeek;
        $schedule = $professional->schedules()
            ->where('weekday', $weekday)
            ->where('is_active', true)
            ->first();

        if (!$schedule) {
            return response()->json([]);
        }

        // $totalDuration is used only to check if the slot (including buffer) fits before
        // the end of working hours. It is NOT passed to isAvailable() — that would double-count the buffer.
        $totalDuration   = $service->duration_minutes + ($service->buffer_minutes ?? 0);
        $startTime       = Carbon::parse($request->date . ' ' . $schedule->start_time);
        $endTime         = Carbon::parse($request->date . ' ' . $schedule->end_time);
        $slots           = [];
        $current         = $startTime->copy();

        // min_advance_hours: the earliest bookable moment (default: 0 = can book for any future time)
        $minAdvanceHours = $workspace->min_advance_hours ?? 0;
        $earliestAllowed = now()->addHours($minAdvanceHours);

        while ($current->copy()->addMinutes($totalDuration)->lte($endTime)) {
            $slotStart = $current->copy();

            // Only offer slots that are strictly in the future and respect min advance
            if ($slotStart->gt($earliestAllowed)) {
                // slotEnd passed to isAvailable is duration_minutes only (no buffer).
                // hasConflict() inside isAvailable() adds buffer_minutes once via $newServiceBuffer,
                // which comes from the $serviceId parameter. Passing duration+buffer here would
                // double-count the buffer against existing appointments.
                $slotEnd = $slotStart->copy()->addMinutes($service->duration_minutes);

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

            // Advance by service duration only (not 30min, not duration+buffer).
            // Slots are offered at each duration_minutes interval. The buffer of existing
            // bookings is enforced by isAvailable(), which rejects conflicting slots naturally.
            $current->addMinutes($service->duration_minutes);
        }

        return response()->json($slots);
    }

    public function store(Request $request, Workspace $workspace)
    {
        $request->validate([
            // Scoped to workspace to prevent cross-tenant enumeration
            'service_id'      => ['required', Rule::exists('services', 'id')->where('workspace_id', $workspace->id)],
            'professional_id' => ['required', Rule::exists('professionals', 'id')->where('workspace_id', $workspace->id)],
            'start_time'      => 'required|date_format:Y-m-d H:i',
            'name'            => 'required|string|max:255',
            'email'           => 'nullable|email|max:255',
            'phone'           => 'required|string|max:20',
        ]);

        $service      = $workspace->services()->findOrFail($request->service_id);
        $professional = $workspace->professionals()->findOrFail($request->professional_id);

        $startTime = Carbon::parse($request->start_time);

        // Reject bookings in the past
        if ($startTime->lte(now())) {
            return response()->json([
                'ok'      => false,
                'code'    => 'past_time',
                'message' => 'Não é possível agendar para um horário no passado.',
            ], 422);
        }

        // Reject bookings before min_advance_hours (default: 0)
        $minAdvanceHours = $workspace->min_advance_hours ?? 0;
        if ($minAdvanceHours > 0 && $startTime->lt(now()->addHours($minAdvanceHours))) {
            return response()->json([
                'ok'      => false,
                'code'    => 'min_advance_not_met',
                'message' => "Agendamentos devem ser feitos com pelo menos {$minAdvanceHours}h de antecedência.",
            ], 422);
        }

        // Reject bookings beyond max_advance_days (default: 90)
        $maxDays = $workspace->max_advance_days ?? 90;
        if ($startTime->gt(now()->startOfDay()->addDays($maxDays))) {
            return response()->json([
                'ok'      => false,
                'code'    => 'max_advance_exceeded',
                'message' => "Agendamentos só podem ser feitos com até {$maxDays} dias de antecedência.",
            ], 422);
        }

        // endsAt is duration_minutes only; the Observer computes buffered_ends_at separately.
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
                'message' => 'Esse horário acabou de ficar indisponível. Atualizamos a lista para você escolher outro.',
            ], 409);
        }

        $phoneDigits = preg_replace('/\D/', '', $request->phone);

        // Customer matching strategy:
        // 1. If an email is provided, look for an exact email match first.
        // 2. Only if no email match is found (or no email was provided), fall back to phone.
        // Using OR between email and phone risks merging different customers who share a phone number.
        $customer = null;

        if ($request->email) {
            $customer = Customer::where('workspace_id', $workspace->id)
                ->where('email', $request->email)
                ->first();
        }

        if (!$customer && $phoneDigits) {
            $customer = Customer::where('workspace_id', $workspace->id)
                ->where('phone', $phoneDigits)
                ->first();
        }

        if ($customer) {
            // Only update phone if the field is empty or changed, never overwrite a different email
            $updates = [];
            if ($phoneDigits && $customer->phone !== $phoneDigits) {
                $updates['phone'] = $phoneDigits;
            }
            if (!empty($updates)) {
                $customer->update($updates);
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
            'professional_id' => $professional->id,
            'service_id'      => $service->id,
            'starts_at'       => $startTime,
            'ends_at'         => $endTime,
            'status'          => 'scheduled',
            'source'          => 'public_link',
        ]);

        return response()->json([
            'ok'             => true,
            'message'        => 'Agendamento realizado com sucesso. Guarde os dados para referência.',
            'appointment_id' => $appointment->id,
        ]);
    }
}
