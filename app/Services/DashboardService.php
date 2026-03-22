<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Charge;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class DashboardService
{
    private function getCacheKeyPrefix()
    {
        return 'dash_v' . Cache::get('dashboard_version', 1) . '_';
    }

    private function measuredCache(string $key, int $ttlSeconds, \Closure $callback)
    {
        $start = microtime(true);
        $hit = Cache::has($key);
        $data = Cache::remember($key, $ttlSeconds, $callback);
        $timeMs = round((microtime(true) - $start) * 1000, 2);
        
        return [$data, $timeMs, $hit];
    }

    public function getDashboardData(array $filters)
    {
        $metricFilters = Arr::except($filters, ['pending_page', 'pending_search', 'pending_status']);
        
        // Include user ID in cache key if user-specific logic applies. Assuming user context is required for true RBAC.
        $userId = auth()->id() ?? 'guest';
        $filterHash = md5(json_encode($metricFilters) . $userId);
        
        $ttl = env('DASHBOARD_CACHE_TTL', 120);
        $prefix = $this->getCacheKeyPrefix();
        $startTime = microtime(true);

        $fromStr = $metricFilters['from'] ?? null;
        $toStr = $metricFilters['to'] ?? null;
        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->startOfMonth();
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();

        $durationInDays = $from->diffInDays($to);
        $prevTo = (clone $from)->subDay()->endOfDay();
        $prevFrom = (clone $prevTo)->subDays($durationInDays)->startOfDay();

        [$cardsData, $cardsTime, $cardsHit] = $this->measuredCache("{$prefix}cards_{$filterHash}", $ttl, function() use ($from, $to, $prevFrom, $prevTo, $metricFilters) {
            $currentCards = $this->getCardsData($from, $to, $metricFilters);
            $previousCards = $this->getCardsData($prevFrom, $prevTo, $metricFilters);
            return [
                'current' => ['cards' => $currentCards],
                'previous' => ['cards' => $previousCards],
                'deltas' => $this->calculateDeltas($currentCards, $previousCards),
            ];
        });

        [$timeseriesData, $tsTime, $tsHit] = $this->measuredCache("{$prefix}ts_{$filterHash}", $ttl, function() use ($from, $to, $metricFilters) {
            return $this->getTimeseries($from, $to, $metricFilters);
        });

        [$rankingServices, $rsTime, $rsHit] = $this->measuredCache("{$prefix}rs_{$filterHash}", $ttl, function() use ($from, $to, $metricFilters) {
            return $this->getServiceRankings($from, $to, $metricFilters);
        });

        [$rankingCustomers, $rcTime, $rcHit] = $this->measuredCache("{$prefix}rc_{$filterHash}", $ttl, function() use ($from, $to, $metricFilters) {
            return $this->getCustomerRankings($from, $to, $metricFilters);
        });

        $totalTimeMs = round((microtime(true) - $startTime) * 1000, 2);

        $pendingStartTime = microtime(true);
        $pendingChargesData = $this->getPendingCharges($filters);
        $pendingTimeMs = round((microtime(true) - $pendingStartTime) * 1000, 2);

        Log::info("Dashboard Load", [
            'total_time_ms' => $totalTimeMs + $pendingTimeMs,
            'blocks' => [
                'cards' => ['ms' => $cardsTime, 'hit' => $cardsHit],
                'timeseries' => ['ms' => $tsTime, 'hit' => $tsHit],
                'ranking_services' => ['ms' => $rsTime, 'hit' => $rsHit],
                'ranking_customers' => ['ms' => $rcTime, 'hit' => $rcHit],
                'pending_table_dynamic' => ['ms' => $pendingTimeMs],
            ]
        ]);

        return array_merge([
            'range' => [
                'from' => $from->toDateTimeString(),
                'to' => $to->toDateTimeString(),
            ],
            'previous_range' => [
                'from' => $prevFrom->toDateTimeString(),
                'to' => $prevTo->toDateTimeString(),
            ],
            'timeseries' => $timeseriesData,
            'ranking_services' => $rankingServices,
            'ranking_customers' => $rankingCustomers,
            'pending_charges' => $pendingChargesData,
        ], $cardsData);
    }

    private function applyFilters($query, array $filters)
    {
        return $query->when(!empty($filters['status']), function (\Illuminate\Database\Eloquent\Builder $q) use ($filters) {
            if ($q->getModel() instanceof Charge) {
                $q->whereIn('appointments.status', $filters['status']);
            } else {
                $q->whereIn('status', $filters['status']);
            }
        })->when(!empty($filters['service_id']), function (\Illuminate\Database\Eloquent\Builder $q) use ($filters) {
            $col = $q->getModel() instanceof Charge ? 'appointments.service_id' : 'service_id';
            $q->where($col, $filters['service_id']);
        })->when(!empty($filters['professional_id']), function (\Illuminate\Database\Eloquent\Builder $q) use ($filters) {
            if (Schema::hasColumn('appointments', 'professional_id')) {
                $col = $q->getModel() instanceof Charge ? 'appointments.professional_id' : 'professional_id';
                $q->where($col, $filters['professional_id']);
            }
        });
    }

    private function getCardsData(Carbon $from, Carbon $to, array $filters)
    {
        $appointmentsQuery = Appointment::whereBetween('starts_at', [$from, $to]);
        $appointmentsQuery = $this->applyFilters($appointmentsQuery, $filters);

        $total = (clone $appointmentsQuery)->count();
        $confirmed = (clone $appointmentsQuery)->where('status', 'confirmed')->count();
        $completed = (clone $appointmentsQuery)->where('status', 'completed')->count();
        $noShow = (clone $appointmentsQuery)->where('status', 'no_show')->count();

        $chargesQuery = Charge::whereHas('appointment', function ($q) use ($from, $to, $filters) {
            $q->whereBetween('starts_at', [$from, $to]);
            $q->when(!empty($filters['status']), fn($sub) => $sub->whereIn('status', $filters['status']))
              ->when(!empty($filters['service_id']), fn($sub) => $sub->where('service_id', $filters['service_id']))
              ->when(!empty($filters['professional_id']), function($sub) use ($filters) {
                  if (Schema::hasColumn('appointments', 'professional_id')) {
                      $sub->where('professional_id', $filters['professional_id']);
                  }
              });
        });

        $pendingAmount = (clone $chargesQuery)->where('status', 'pending')->sum('amount');
        $paidAmount = (clone $chargesQuery)->where('status', 'paid')->sum('amount');
        $overdueAmount = (clone $chargesQuery)->where('status', 'overdue')->sum('amount');

        return [
            'appointments_total' => $total,
            'appointments_confirmed' => $confirmed,
            'appointments_completed' => $completed,
            'appointments_no_show' => $noShow,
            'confirmation_rate' => $total > 0 ? round(($confirmed / $total) * 100, 2) : 0,
            'no_show_rate' => $total > 0 ? round(($noShow / $total) * 100, 2) : 0,
            'pending_amount' => (float) $pendingAmount,
            'paid_amount' => (float) $paidAmount,
            'overdue_amount' => (float) $overdueAmount,
        ];
    }

    private function getTimeseries(Carbon $from, Carbon $to, array $filters)
    {
        $appointmentsQuery = Appointment::whereBetween('starts_at', [$from, $to]);
        $appointmentsQuery = $this->applyFilters($appointmentsQuery, $filters);

        $appointmentsDaily = (clone $appointmentsQuery)
            ->selectRaw('DATE(starts_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        $chargesQuery = Charge::join('appointments', 'charges.appointment_id', '=', 'appointments.id')
            ->whereBetween('appointments.starts_at', [$from, $to])
            ->whereIn('charges.status', ['paid', 'pending', 'overdue']);
        
        $chargesQuery = $this->applyFilters($chargesQuery, $filters);

        $chargesDaily = (clone $chargesQuery)
            ->selectRaw('DATE(appointments.starts_at) as date, sum(amount) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $timeseries = [];
        $period = CarbonPeriod::create($from, $to);
        foreach ($period as $date) {
            $dateString = $date->format('Y-m-d');
            $timeseries[] = [
                'date' => $date->format('d/m'),
                'full_date' => $dateString,
                'appointments' => $appointmentsDaily->get($dateString, 0),
                'revenue' => (float) $chargesDaily->get($dateString, 0),
            ];
        }

        return $timeseries;
    }

    private function getServiceRankings(Carbon $from, Carbon $to, array $filters)
    {
        $query = Appointment::query()
            ->leftJoin('services', 'appointments.service_id', '=', 'services.id')
            ->select(
                'appointments.service_id',
                DB::raw('MAX(services.name) as service_name'),
                DB::raw('COUNT(appointments.id) as total_appointments')
            )
            ->whereBetween('appointments.starts_at', [$from, $to])
            ->whereNotNull('appointments.service_id')
            ->groupBy('appointments.service_id');

        if (!empty($filters['status'])) $query->whereIn('appointments.status', $filters['status']);
        if (!empty($filters['service_id'])) $query->where('appointments.service_id', $filters['service_id']);
        if (!empty($filters['professional_id']) && Schema::hasColumn('appointments', 'professional_id')) {
            $query->where('appointments.professional_id', $filters['professional_id']);
        }

        $appAgg = $query->get()->keyBy('service_id');

        $revQuery = Charge::query()
            ->join('appointments', 'charges.appointment_id', '=', 'appointments.id')
            ->select(
                'appointments.service_id',
                DB::raw('SUM(charges.amount) as total_revenue')
            )
            ->whereBetween('appointments.starts_at', [$from, $to])
            ->whereIn('charges.status', ['paid', 'pending', 'overdue'])
            ->whereNotNull('appointments.service_id')
            ->groupBy('appointments.service_id');

        if (!empty($filters['status'])) $revQuery->whereIn('appointments.status', $filters['status']);
        if (!empty($filters['service_id'])) $revQuery->where('appointments.service_id', $filters['service_id']);
        if (!empty($filters['professional_id']) && Schema::hasColumn('appointments', 'professional_id')) {
            $revQuery->where('appointments.professional_id', $filters['professional_id']);
        }

        $revAgg = $revQuery->get()->keyBy('service_id');
        $serviceIds = $appAgg->keys()->merge($revAgg->keys())->unique();

        $rankings = [];
        foreach ($serviceIds as $serviceId) {
            $appInfo = $appAgg->get($serviceId);
            $revInfo = $revAgg->get($serviceId);

            $rankings[] = [
                'service_id' => $serviceId,
                'service_name' => $appInfo ? $appInfo->service_name : 'Desconhecido',
                'total_appointments' => $appInfo ? $appInfo->total_appointments : 0,
                'total_revenue' => $revInfo ? (float) $revInfo->total_revenue : 0,
            ];
        }

        usort($rankings, function ($a, $b) {
            return $b['total_revenue'] <=> $a['total_revenue'] ?: $b['total_appointments'] <=> $a['total_appointments'];
        });

        return array_slice($rankings, 0, 10);
    }

    private function getCustomerRankings(Carbon $from, Carbon $to, array $filters)
    {
        $query = Appointment::query()
            ->leftJoin('customers', 'appointments.customer_id', '=', 'customers.id')
            ->select(
                'appointments.customer_id',
                DB::raw('MAX(customers.name) as customer_name'),
                DB::raw('COUNT(appointments.id) as total_appointments')
            )
            ->whereBetween('appointments.starts_at', [$from, $to])
            ->whereNotNull('appointments.customer_id')
            ->groupBy('appointments.customer_id');

        if (!empty($filters['status'])) $query->whereIn('appointments.status', $filters['status']);
        if (!empty($filters['service_id'])) $query->where('appointments.service_id', $filters['service_id']);
        if (!empty($filters['professional_id']) && Schema::hasColumn('appointments', 'professional_id')) {
            $query->where('appointments.professional_id', $filters['professional_id']);
        }

        $appAgg = $query->get()->keyBy('customer_id');

        $revQuery = Charge::query()
            ->join('appointments', 'charges.appointment_id', '=', 'appointments.id')
            ->select(
                'appointments.customer_id',
                DB::raw('SUM(charges.amount) as total_spent')
            )
            ->whereBetween('appointments.starts_at', [$from, $to])
            ->where('charges.status', 'paid')
            ->whereNotNull('appointments.customer_id')
            ->groupBy('appointments.customer_id');

        if (!empty($filters['status'])) $revQuery->whereIn('appointments.status', $filters['status']);
        if (!empty($filters['service_id'])) $revQuery->where('appointments.service_id', $filters['service_id']);
        if (!empty($filters['professional_id']) && Schema::hasColumn('appointments', 'professional_id')) {
            $revQuery->where('appointments.professional_id', $filters['professional_id']);
        }

        $revAgg = $revQuery->get()->keyBy('customer_id');
        $customerIds = $appAgg->keys()->merge($revAgg->keys())->unique();

        $rankings = [];
        foreach ($customerIds as $customerId) {
            $appInfo = $appAgg->get($customerId);
            $revInfo = $revAgg->get($customerId);

            $rankings[] = [
                'customer_id' => $customerId,
                'customer_name' => $appInfo ? $appInfo->customer_name : 'Desconhecido',
                'total_appointments' => $appInfo ? $appInfo->total_appointments : 0,
                'total_spent' => $revInfo ? (float) $revInfo->total_spent : 0,
            ];
        }

        usort($rankings, function ($a, $b) {
            return $b['total_spent'] <=> $a['total_spent'] ?: $b['total_appointments'] <=> $a['total_appointments'];
        });

        return array_slice($rankings, 0, 10);
    }

    private function getPendingCharges(array $filters)
    {
        $fromStr = $filters['from'] ?? null;
        $toStr = $filters['to'] ?? null;
        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->startOfMonth();
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();

        $query = Charge::with('appointment.customer')
            ->whereHas('appointment', function ($q) use ($from, $to, $filters) {
                $q->whereBetween('starts_at', [$from, $to]);
                
                $q->when(!empty($filters['status']), fn($sub) => $sub->whereIn('status', $filters['status']))
                  ->when(!empty($filters['service_id']), fn($sub) => $sub->where('service_id', $filters['service_id']))
                  ->when(!empty($filters['professional_id']), function($sub) use ($filters) {
                      if (Schema::hasColumn('appointments', 'professional_id')) {
                          $sub->where('professional_id', $filters['professional_id']);
                      }
                  });
            });

        $status = $filters['pending_status'] ?? 'all';
        if ($status === 'pending') {
            $query->where('charges.status', 'pending');
        } elseif ($status === 'overdue') {
            $query->where('charges.status', 'overdue');
        } else {
            $query->whereIn('charges.status', ['pending', 'overdue']);
        }

        if (!empty($filters['pending_search'])) {
            $query->whereHas('appointment.customer', function($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['pending_search'] . '%');
            });
        }

        $query->orderByRaw("CASE WHEN charges.status = 'overdue' THEN 1 ELSE 2 END")
              ->orderBy('due_date', 'asc');

        $page = $filters['pending_page'] ?? 1;
        $paginator = $query->paginate(10, ['*'], 'pending_page', $page);
        
        $items = collect($paginator->items())->map(function ($charge) {
            return [
                'id' => $charge->id,
                'customer_name' => collect($charge->appointment->customer)->get('name', 'Desconhecido'),
                'amount' => (float) $charge->amount,
                'status' => $charge->status,
                'due_date' => $charge->due_date ? $charge->due_date->format('Y-m-d') : null,
            ];
        });

        return [
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        ];
    }
    
    public function getDayDetails(string $date, array $filters)
    {
        $day = Carbon::parse($date);
        
        $query = Appointment::with(['customer', 'service', 'charge'])
            ->whereBetween('starts_at', [$day->clone()->startOfDay(), $day->clone()->endOfDay()]);
            
        $query = $this->applyFilters($query, $filters);
        
        $appointments = $query->paginate(15);
        $appointmentsData = collect($appointments->items());
        
        $statusDistribution = $appointmentsData->groupBy('status')->map->count();
        
        $paid = $appointmentsData->map(fn($a) => $a->charge)->where('status', 'paid')->sum('amount');
        $pending = $appointmentsData->map(fn($a) => $a->charge)->where('status', 'pending')->sum('amount');
        $overdue = $appointmentsData->map(fn($a) => $a->charge)->where('status', 'overdue')->sum('amount');
        
        return [
            'appointments' => $appointments, 
            'financial' => [
                'paid' => (float) $paid,
                'pending' => (float) $pending,
                'overdue' => (float) $overdue,
            ],
            'status_distribution' => $statusDistribution
        ];
    }

    public function calculateDeltas(array $current, array $previous)
    {
        $deltas = [];
        $keys = [
            'appointments_total',
            'confirmation_rate',
            'no_show_rate',
            'paid_amount',
            'pending_amount',
            'overdue_amount'
        ];

        foreach ($keys as $key) {
            $cur = $current[$key] ?? 0;
            $prev = $previous[$key] ?? 0;
            
            $absolute = $cur - $prev;
            $percentage = $prev > 0 ? ($absolute / $prev) * 100 : ($cur > 0 ? 100 : 0);

            $deltas[$key] = [
                'absolute' => is_float($absolute) ? round($absolute, 2) : $absolute,
                'percentage' => round($percentage, 2),
            ];
        }

        return $deltas;
    }

    public function generateCsv(array $data)
    {
        $csv = "Metric,Value\n";
        $csv .= "Total Appointments," . $data['current']['cards']['appointments_total'] . "\n";
        $csv .= "Confirmation Target," . $data['current']['cards']['confirmation_rate'] . "%\n";
        $csv .= "No Show Rate," . $data['current']['cards']['no_show_rate'] . "%\n";
        $csv .= "Paid Amount," . $data['current']['cards']['paid_amount'] . "\n";
        $csv .= "Pending Amount," . $data['current']['cards']['pending_amount'] . "\n";
        $csv .= "Overdue Amount," . $data['current']['cards']['overdue_amount'] . "\n";
        
        $csv .= "\nPending Charges\n";
        $csv .= "Customer,Amount,Due Date,Status\n";
        
        foreach ($data['pending_charges']['data'] ?? [] as $charge) {
            $csv .= "{$charge['customer_name']},{$charge['amount']},{$charge['due_date']},{$charge['status']}\n";
        }
        
        return $csv;
    }
}
