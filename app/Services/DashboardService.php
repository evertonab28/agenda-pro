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
        
        $ttl = (int) env('DASHBOARD_CACHE_TTL', 120);
        $prefix = $this->getCacheKeyPrefix();
        $startTime = microtime(true);

        $fromStr = $metricFilters['from'] ?? null;
        $toStr = $metricFilters['to'] ?? null;
        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->startOfMonth();
        // Default to end-of-month so future scheduled appointments in the current
        // month are visible without the user having to set a custom date range.
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfMonth()->endOfDay();

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
        return $query->when(!empty($filters['status']), function ($q) use ($filters) {
            if ($q->getModel() instanceof Charge) {
                $q->whereHas('appointment', function ($sub) use ($filters) {
                    $sub->whereIn('status', $filters['status']);
                });
            } else {
                $q->whereIn('status', $filters['status']);
            }
        })->when(!empty($filters['service_id']), function ($q) use ($filters) {
            if ($q->getModel() instanceof Charge) {
                $q->whereHas('appointment', function ($sub) use ($filters) {
                    $sub->where('service_id', $filters['service_id']);
                });
            } else {
                $q->where('service_id', $filters['service_id']);
            }
        })->when(!empty($filters['professional_id']), function ($q) use ($filters) {
            if ($q->getModel() instanceof Charge) {
                $q->whereHas('appointment', function ($sub) use ($filters) {
                    $sub->where('professional_id', $filters['professional_id']);
                });
            } else {
                $q->where('professional_id', $filters['professional_id']);
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

        $chargesQuery = Charge::whereBetween('due_date', [$from, $to]);
        $chargesQuery = $this->applyFilters($chargesQuery, $filters);

        $pendingAmount = (clone $chargesQuery)->where('status', 'pending')->sum('amount');
        $paidAmount = (clone $chargesQuery)->where('status', 'paid')->sum('amount');
        $overdueAmount = (clone $chargesQuery)->where('status', 'overdue')->sum('amount');

        return [
            'appointments_total' => $total,
            'appointments_confirmed' => $confirmed,
            'appointments_completed' => $completed,
            'appointments_no_show' => $noShow,
            'confirmation_rate' => $total > 0 ? round((($confirmed + $completed) / $total) * 100, 2) : 0,
            'no_show_rate' => $total > 0 ? round(($noShow / $total) * 100, 2) : 0,
            'pending_amount' => (float) $pendingAmount,
            'paid_amount' => (float) $paidAmount,
            'overdue_amount' => (float) $overdueAmount,
        ];
    }

    private function getTimeseries(Carbon $from, Carbon $to, array $filters)
    {
        $appointmentsQuery = Appointment::where(function ($q) use ($from, $to) {
            $q->whereBetween('starts_at', [$from, $to]);
        });
        $appointmentsQuery = $this->applyFilters($appointmentsQuery, $filters);

        $appointmentsDaily = (clone $appointmentsQuery)
            ->selectRaw('DATE(starts_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        $chargesQuery = Charge::whereBetween('due_date', [$from, $to])
            ->whereIn('status', ['paid', 'pending', 'overdue']);
        
        $chargesQuery = $this->applyFilters($chargesQuery, $filters);

        $chargesDaily = (clone $chargesQuery)
            ->selectRaw('DATE(due_date) as date, sum(amount) as total')
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
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('appointments.starts_at', [$from, $to]);
            })
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
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('appointments.starts_at', [$from, $to]);
            })
            ->where(function ($q) {
                $q->where('appointments.status', '!=', 'canceled');
            })
            ->where(function ($q) {
                $q->whereNotNull('appointments.service_id');
            })
            ->groupBy('appointments.service_id');

        if (!empty($filters['status'])) {
            $revQuery->where(function ($q) use ($filters) {
                $q->whereIn('appointments.status', $filters['status']);
            });
        }
        if (!empty($filters['service_id'])) {
            $revQuery->where(function ($q) use ($filters) {
                $q->where('appointments.service_id', $filters['service_id']);
            });
        }
        if (!empty($filters['professional_id'])) {
            $revQuery->where(function ($q) use ($filters) {
                $q->where('appointments.professional_id', $filters['professional_id']);
            });
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
            ->whereBetween('charges.paid_at', [$from, $to])
            ->where('charges.status', 'paid')
            ->whereNotNull('appointments.customer_id')
            ->groupBy('appointments.customer_id');

        if (!empty($filters['status'])) {
            $revQuery->where(function ($sub) use ($filters) {
                $sub->whereIn('appointments.status', $filters['status']);
            });
        }
        if (!empty($filters['service_id'])) {
            $revQuery->where(function ($sub) use ($filters) {
                $sub->where('appointments.service_id', $filters['service_id']);
            });
        }
        if (!empty($filters['professional_id']) && Schema::hasColumn('appointments', 'professional_id')) {
            $revQuery->where(function ($sub) use ($filters) {
                $sub->where('appointments.professional_id', $filters['professional_id']);
            });
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
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfMonth()->endOfDay();

        $query = Charge::with('appointment.customer')
            ->whereHas('appointment', function ($q) use ($from, $to, $filters) {
                $q->whereBetween('starts_at', [$from, $to]);
                
                $q->when(!empty($filters['status']), function($sub) use ($filters) {
                    $sub->whereIn('status', $filters['status']);
                })->when(!empty($filters['service_id']), function($sub) use ($filters) {
                    $sub->where('service_id', $filters['service_id']);
                })->when(!empty($filters['professional_id']), function($sub) use ($filters) {
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
        
        $paid = $appointmentsData->map(function($a) { return $a->charge; })->where('status', 'paid')->sum('amount');
        $pending = $appointmentsData->map(function($a) { return $a->charge; })->where('status', 'pending')->sum('amount');
        $overdue = $appointmentsData->map(function($a) { return $a->charge; })->where('status', 'overdue')->sum('amount');
        
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

    /**
     * getOccupancyHeatmap
     */
    public function getOccupancyHeatmap(array $filters = []): array
    {
        $fromStr = $filters['from'] ?? null;
        $toStr = $filters['to'] ?? null;
        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->subDays(30)->startOfDay();
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();
        
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $hourExpr = $isSqlite ? "strftime('%H', starts_at)" : "HOUR(starts_at)";

        $query = Appointment::whereBetween('starts_at', [$from, $to])
            ->where('status', '!=', 'canceled');
        
        $query = $this->applyFilters($query, $filters);

        $data = $query->selectRaw("$hourExpr as hour, count(*) as count")
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        if ($data->isEmpty()) {
            return [];
        }

        $minHour = (int) $data->min('hour');
        $maxHour = (int) $data->max('hour');

        // Garantir um range mínimo para visualização (ex: 8h às 18h se os dados forem muito concentrados)
        $start = min($minHour, 8);
        $end = max($maxHour, 20);

        $heatmap = [];
        for ($i = $start; $i <= $end; $i++) {
            $hourStr = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
            $match = $data->firstWhere('hour', (string) $i) ?: $data->firstWhere('hour', (int) $i) ?: $data->firstWhere('hour', str_pad($i, 2, '0', STR_PAD_LEFT));
            $heatmap[] = [
                'hour' => $hourStr,
                'count' => $match ? (int) $match->count : 0
            ];
        }

        return $heatmap;
    }

    /**
     * getRevenueComparison
     */
    public function getRevenueComparison(array $filters = []): array
    {
        $fromStr = $filters['from'] ?? null;
        $toStr = $filters['to'] ?? null;
        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->subDays(30)->startOfDay();
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();
        
        $forecastedQuery = Charge::whereBetween('due_date', [$from, $to])
            ->where('status', '!=', 'canceled');
        $forecastedQuery = $this->applyFilters($forecastedQuery, $filters);
        $forecasted = $forecastedQuery->sum('amount');

        $realizedQuery = Charge::whereBetween('due_date', [$from, $to])
            ->where('status', 'paid');
        $realizedQuery = $this->applyFilters($realizedQuery, $filters);
        $realized = $realizedQuery->sum('amount');
            
        // Gap based on no-shows revenue
        $gapQuery = Charge::whereHas('appointment', function($q) use ($from, $to, $filters) {
                $q->whereBetween('starts_at', [$from, $to])
                  ->where('status', 'no_show');
                $this->applyFilters($q, $filters);
            });
        $gap = $gapQuery->sum('amount');

        return [
            'forecasted' => (float) $forecasted,
            'realized' => (float) $realized,
            'gap' => (float) $gap,
        ];
    }

    /**
     * getNoShowRanking
     */
    public function getNoShowRanking(array $filters = []): array
    {
        $fromStr = $filters['from'] ?? null;
        $toStr = $filters['to'] ?? null;
        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->subDays(30)->startOfDay();
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();
        
        $query = Appointment::join('services', 'appointments.service_id', '=', 'services.id')
            ->whereBetween('appointments.starts_at', [$from, $to])
            ->where('appointments.status', 'no_show');

        if (!empty($filters['professional_id'])) {
            $query->where('appointments.professional_id', $filters['professional_id']);
        }

        return $query->selectRaw('services.name, count(*) as total')
            ->groupBy('services.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->toArray();
    }

    /**
     * getRetentionMetrics
     */
    public function getRetentionMetrics(array $filters = []): array
    {
        $fromStr = $filters['from'] ?? null;
        $toStr = $filters['to'] ?? null;
        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->subDays(30)->startOfDay();
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();
        
        $totalCustomersQuery = Appointment::whereBetween('starts_at', [$from, $to])
            ->where('status', 'completed');
        $totalCustomersQuery = $this->applyFilters($totalCustomersQuery, $filters);
        $totalCustomersCount = $totalCustomersQuery->distinct('customer_id')
            ->count('customer_id');

        $returningCustomersCount = Appointment::where('status', 'completed')
            ->whereIn('customer_id', function($query) use ($from, $to, $filters) {
                $query->select('customer_id')
                    ->from('appointments')
                    ->whereBetween('starts_at', [$from, $to])
                    ->where('status', 'completed');
                // Note: applyFilters might not work perfectly inside closure if it expects specific model, 
                // but standard columns like professional_id should be fine.
                if (!empty($filters['professional_id'])) {
                    $query->where('professional_id', $filters['professional_id']);
                }
            })
            ->selectRaw('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('count(*) > 1')
            ->get()
            ->count();

        return [
            'total' => $totalCustomersCount,
            'returning' => $returningCustomersCount,
            'rate' => $totalCustomersCount > 0 ? round(($returningCustomersCount / $totalCustomersCount) * 100, 2) : 0,
        ];
    }

    /**
     * getDailyActions (Next Best Action)
     */
    /**
     * getDailyActions (Next Best Action)
     */
    public function getDailyActions(): array
    {
        $today = now()->startOfDay();
        
        // Prioridade 1: Vencidos há mais de 3 dias
        $highPriority = Charge::with('customer')
            ->where('status', 'overdue')
            ->where('due_date', '<=', $today->clone()->subDays(3))
            ->orderBy('due_date', 'asc')
            ->limit(3)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'customer_name' => $c->customer?->name ?? 'Desconhecido',
                'customer_phone' => $c->customer?->phone,
                'amount' => (float) $c->amount,
                'due_date' => $c->due_date ? $c->due_date->format('d/m') : '?',
                'priority' => 'high',
                'suggestion' => 'Cobrança Crítica: Enviar link via WhatsApp',
                'action_label' => 'Enviar Link',
                'action_type' => 'payment_link',
                'url' => route('finance.charges.show', $c->id)
            ]);

        // Prioridade 2: Vencidos recentemente (1-3 dias)
        $mediumPriority = Charge::with('customer')
            ->where('status', 'overdue')
            ->where('due_date', '>', $today->clone()->subDays(3))
            ->orderBy('due_date', 'asc')
            ->limit(3)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'customer_name' => $c->customer?->name ?? 'Desconhecido',
                'customer_phone' => $c->customer?->phone,
                'amount' => (float) $c->amount,
                'due_date' => $c->due_date ? $c->due_date->format('d/m') : '?',
                'priority' => 'medium',
                'suggestion' => 'Lembrete de Atraso: Notificar cliente',
                'action_label' => 'Notificar',
                'action_type' => 'whatsapp_reminder',
                'url' => route('finance.charges.show', $c->id)
            ]);

        // Prioridade 3: Vencendo hoje
        $lowPriority = Charge::with('customer')
            ->where('status', 'pending')
            ->where('due_date', $today)
            ->orderBy('due_date', 'asc')
            ->limit(3)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'customer_name' => $c->customer?->name ?? 'Desconhecido',
                'customer_phone' => $c->customer?->phone,
                'amount' => (float) $c->amount,
                'due_date' => 'Hoje',
                'priority' => 'low',
                'suggestion' => 'Vencendo hoje: Confirmar recebimento',
                'action_label' => 'Confirmar',
                'action_type' => 'confirm_payment',
                'url' => route('finance.charges.show', $c->id)
            ]);

        // Prioridade 4: Ações de CRM (Re-engajamento, etc)
        $crmActions = \App\Models\CRMAction::with('customer')
            ->where('status', 'pending')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'customer_name' => $a->customer?->name ?? 'Desconhecido',
                'customer_phone' => $a->customer?->phone,
                'amount' => 0,
                'due_date' => $a->created_at ? $a->created_at->format('d/m') : '?',
                'priority' => $a->priority,
                'suggestion' => $a->title . ': ' . $a->description,
                'action_label' => 'Ver Cliente',
                'action_type' => 'crm_action',
                'url' => route('customers.show', $a->customer_id)
            ]);

        return collect($highPriority)
            ->merge($mediumPriority)
            ->merge($lowPriority)
            ->merge($crmActions)
            ->values()
            ->toArray();
    }

    /**
     * getTodayAppointments
     */
    public function getTodayAppointments(): array
    {
        $today = now()->startOfDay();
        $tomorrow = (clone $today)->endOfDay();

        return Appointment::with(['customer', 'service', 'professional', 'charge'])
            ->whereBetween('starts_at', [$today, $tomorrow])
            ->where('status', '!=', 'canceled')
            ->orderBy('starts_at', 'asc')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->customer?->name ?? 'Desconhecido',
                'service' => $a->service?->name ?? 'Serviço',
                'time' => $a->starts_at ? $a->starts_at->format('H:i') : '--:--',
                'professional' => $a->professional?->name ?? 'N/A',
                'status' => $this->mapStatus($a->status),
                'value' => (float) ($a->charge?->amount ?? 0)
            ])
            ->toArray();
    }

    /**
     * getAtRiskCustomers
     */
    public function getAtRiskCustomers(): array
    {
        return \App\Models\Customer::where('current_segment', 'Em Risco')
            ->where('is_active', true)
            ->with(['appointments' => fn($q) => $q->where('status', 'completed')->latest('starts_at')])
            ->limit(10)
            ->get()
            ->map(function($c) {
                $lastApp = $c->appointments->first();
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'days_without_appointment' => $lastApp ? (int) $lastApp->starts_at->diffInDays(now()) : 0,
                    'last_service' => $lastApp?->service?->name ?? 'N/A'
                ];
            })
            ->toArray();
    }

    /**
     * Map backend status to frontend status pill keys
     */
    private function mapStatus(string $status): string
    {
        $map = [
            'scheduled' => 'pending',
            'confirmed' => 'confirmed',
            'completed' => 'completed',
            'no_show'   => 'noshow',
            'canceled'  => 'cancelled'
        ];
        return $map[$status] ?? 'pending';
    }
}
