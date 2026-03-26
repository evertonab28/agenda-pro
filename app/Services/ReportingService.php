<?php

namespace App\Services;

use App\Models\Charge;
use App\Models\Receipt;
use App\Models\Service;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportingService
{
    /**
     * Get monthly financial trend for the last X months.
     */
    public function getFinancialTrend(int $clinicId, int $months = 6): array
    {
        $data = [];
        $start = now()->subMonths($months - 1)->startOfMonth();

        for ($i = 0; $i < $months; $i++) {
            $month = $start->clone()->addMonths($i);
            $monthLabel = $month->translatedFormat('M/Y');

            $planned = Charge::where('clinic_id', $clinicId)
                ->whereMonth('due_date', $month->month)
                ->whereYear('due_date', $month->year)
                ->sum('amount');

            $actual = Receipt::where('clinic_id', $clinicId)
                ->whereMonth('received_at', $month->month)
                ->whereYear('received_at', $month->year)
                ->sum('amount_received');

            $data[] = [
                'month' => $monthLabel,
                'planned' => (float) $planned,
                'actual' => (float) $actual,
            ];
        }

        return $data;
    }

    /**
     * Get service popularity and revenue ranking.
     */
    public function getServicePerformance(int $clinicId): Collection
    {
        return Service::where('clinic_id', $clinicId)
            ->withCount(['appointments' => function ($query) {
                $query->where('status', 'finished');
            }])
            ->get()
            ->map(function ($service) use ($clinicId) {
                $revenue = DB::table('charges')
                    ->join('appointments', 'charges.appointment_id', '=', 'appointments.id')
                    ->where('appointments.service_id', $service->id)
                    ->where('charges.clinic_id', $clinicId)
                    ->where('charges.status', 'paid')
                    ->sum('charges.amount');

                return [
                    'name' => $service->name,
                    'count' => $service->appointments_count,
                    'revenue' => (float) $revenue,
                ];
            })
            ->sortByDesc('revenue')
            ->values();
    }

    /**
     * Get top customers by Lifetime Value (LTV).
     */
    public function getCustomerInsights(int $clinicId, int $limit = 10): Collection
    {
        return Customer::where('clinic_id', $clinicId)
            ->withCount(['appointments' => function ($query) {
                $query->where('status', 'finished');
            }])
            ->get()
            ->map(function ($customer) use ($clinicId) {
                $totalPaid = Receipt::where('clinic_id', $clinicId)
                    ->whereHas('charge', function ($query) use ($customer) {
                        $query->where('customer_id', $customer->id);
                    })
                    ->sum('amount_received');

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'appointments_count' => $customer->appointments_count,
                    'ltv' => (float) $totalPaid,
                ];
            })
            ->sortByDesc('ltv')
            ->take($limit)
            ->values();
    }
}
