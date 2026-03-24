<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AgendaService
{
    /**
     * Get appointments for the calendar view with filters.
     */
    public function getAgendaEvents(array $filters)
    {
        $query = Appointment::with(['customer', 'service', 'professional', 'charge.receipts'])
            ->whereBetween('starts_at', [
                Carbon::parse($filters['from'])->startOfDay(),
                Carbon::parse($filters['to'])->endOfDay(),
            ]);

        if (!empty($filters['professional_id'])) {
            $query->where('professional_id', $filters['professional_id']);
        }

        if (!empty($filters['status'])) {
            $query->whereIn('status', $filters['status']);
        }

        if (!empty($filters['service_id'])) {
            $query->where('service_id', $filters['service_id']);
        }

        return $query->get()->map(function ($app) {
            $charge = $app->charge;
            $amountPaid = $charge ? $charge->receipts->sum('amount_received') : 0;
            
            return [
                'id' => $app->id,
                'title' => ($app->customer?->name ?? 'Cliente') . ' - ' . ($app->service?->name ?? 'Serviço'),
                'start' => $app->starts_at->toIso8601String(),
                'end' => $app->ends_at->toIso8601String(),
                'status' => $app->status,
                'customer' => $app->customer,
                'service' => $app->service,
                'professional' => $app->professional,
                'notes' => $app->notes,
                'charge' => $charge ? [
                    'id' => $charge->id,
                    'status' => $charge->status,
                    'amount' => $charge->amount,
                    'paid' => $amountPaid,
                ] : null,
            ];
        });
    }

    /**
     * Check if a professional has any overlapping appointments, considering buffers.
     */
    public function hasConflict(int $professionalId, string $startsAt, string $endsAt, $excludeId = null, int $newServiceBuffer = 0): bool
    {
        $start = Carbon::parse($startsAt);
        $end = Carbon::parse($endsAt)->addMinutes($newServiceBuffer);

        $dbDriver = DB::getDriverName();
        if ($dbDriver === 'sqlite') {
            $bufferSql = "datetime(appointments.ends_at, '+' || services.buffer_minutes || ' minutes')";
        } else {
            $bufferSql = "DATE_ADD(appointments.ends_at, INTERVAL services.buffer_minutes MINUTE)";
        }

        return Appointment::query()
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->where('appointments.professional_id', $professionalId)
            ->where(function ($query) use ($start, $end, $bufferSql) {
                // An existing appointment A conflicts with new B if:
                // start_B < end_A + buffer_A  AND  end_B + buffer_B > start_A
                
                $query->where(function ($q) use ($start, $end, $bufferSql) {
                    $q->where('appointments.starts_at', '<', $end)
                      ->where(DB::raw($bufferSql), '>', $start);
                });
            })
            ->when($excludeId, fn ($q) => $q->where('appointments.id', '!=', $excludeId))
            ->whereNotIn('appointments.status', ['canceled', 'no_show'])
            ->exists();
    }

    /**
     * Check if a professional is available at a given time.
     */
    public function isAvailable(int $professionalId, string $startsAt, string $endsAt, $excludeId = null, int $serviceId = null): array
    {
        $start = Carbon::parse($startsAt);
        $end = Carbon::parse($endsAt);
        $date = $start->toDateString();
        $weekday = $start->dayOfWeek;

        $serviceBuffer = 0;
        if ($serviceId) {
            $serviceBuffer = Service::where('id', $serviceId)->value('buffer_minutes') ?? 0;
        }

        // 1. Check existing conflicts (including buffers)
        if ($this->hasConflict($professionalId, $startsAt, $endsAt, $excludeId, $serviceBuffer)) {
            return ['available' => false, 'message' => 'O horário (incluindo o intervalo de limpeza/buffer) coincide com outro agendamento.'];
        }

        // 2. Check Holidays/Blocked dates
        $isHoliday = \App\Models\Holiday::where(function ($q) use ($date, $professionalId) {
                $q->where('date', $date)
                    ->where(function ($sq) use ($professionalId) {
                        $sq->whereNull('professional_id')
                            ->orWhere('professional_id', $professionalId);
                    });
            })
            ->orWhere(function ($q) use ($start, $professionalId) {
                $q->where('repeats_yearly', true)
                    ->whereMonth('date', $start->month)
                    ->whereDay('date', $start->day)
                    ->where(function ($sq) use ($professionalId) {
                        $sq->whereNull('professional_id')
                            ->orWhere('professional_id', $professionalId);
                    });
            })
            ->exists();

        if ($isHoliday) {
            return ['available' => false, 'message' => 'Data bloqueada ou feriado.'];
        }

        // 3. Check Weekly Schedule
        $schedule = \App\Models\ProfessionalSchedule::where('professional_id', $professionalId)
            ->where('weekday', $weekday)
            ->where('is_active', true)
            ->first();

        if (!$schedule) {
            return ['available' => false, 'message' => 'O profissional não atende neste dia.'];
        }

        $open = Carbon::parse($date . ' ' . $schedule->start_time);
        $close = Carbon::parse($date . ' ' . $schedule->end_time);

        if ($start->lt($open) || $end->gt($close)) {
            return ['available' => false, 'message' => "Fora do horário de expediente ({$schedule->start_time} - {$schedule->end_time})."];
        }

        // 4. Check Breaks
        if ($schedule->break_start && $schedule->break_end) {
            $breakStart = Carbon::parse($date . ' ' . $schedule->break_start);
            $breakEnd = Carbon::parse($date . ' ' . $schedule->break_end);

            if ($start->lt($breakEnd) && $end->gt($breakStart)) {
                return ['available' => false, 'message' => "Horário coincide com o intervalo ({$schedule->break_start} - {$schedule->break_end})."];
            }
        }

        return ['available' => true];
    }

    /**
     * Calculate end date based on service duration.
     */
    public function calculateEndDate(int $serviceId, string $startsAt): Carbon
    {
        $service = Service::findOrFail($serviceId);
        $duration = $service->duration_minutes ?: 30;

        return Carbon::parse($startsAt)->addMinutes($duration);
    }
}
