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
        $query = Appointment::with(['customer', 'service', 'professional'])
            ->whereBetween('starts_at', [
                Carbon::parse($filters['from'])->startOfDay(),
                Carbon::parse($filters['to'])->endOfDay(),
            ]);

        if (!empty($filters['professional_id'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('professional_id', $filters['professional_id']);
            });
        }

        if (!empty($filters['status'])) {
            $query->whereIn('status', $filters['status']);
        }

        if (!empty($filters['service_id'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('service_id', $filters['service_id']);
            });
        }

        return $query->get()->map(function ($app) {
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
            ];
        });
    }

    /**
     * Check if a professional has any overlapping appointments.
     */
    public function hasConflict(int $professionalId, string $startsAt, string $endsAt, $excludeId = null): bool
    {
        $start = Carbon::parse($startsAt);
        $end = Carbon::parse($endsAt);

        return Appointment::where('professional_id', $professionalId)
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('starts_at', [$start, $end->copy()->subSecond()])
                    ->orWhereBetween('ends_at', [$start->copy()->addSecond(), $end])
                    ->orWhere(function ($sub) use ($start, $end) {
                        $sub->where('starts_at', '<=', $start)
                            ->where('ends_at', '>=', $end);
                    });
            })
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->whereNotIn('status', ['canceled', 'no_show'])
            ->exists();
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
