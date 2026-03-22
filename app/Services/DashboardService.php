<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Charge;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class DashboardService
{
    public function getDashboardData(array $filters)
    {
        $cacheKey = 'dashboard_data_' . md5(json_encode($filters));

        return Cache::remember($cacheKey, 120, function () use ($filters) {
            $fromStr = $filters['from'] ?? null;
            $toStr = $filters['to'] ?? null;

            $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->startOfMonth();
            $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();

            // Calculate Previous Period
            $durationInDays = $from->diffInDays($to);
            $prevTo = (clone $from)->subDay()->endOfDay();
            $prevFrom = (clone $prevTo)->subDays($durationInDays)->startOfDay();

            $currentCards = $this->getCardsData($from, $to, $filters);
            $previousCards = $this->getCardsData($prevFrom, $prevTo, $filters);

            $deltas = $this->calculateDeltas($currentCards, $previousCards);

            return [
                'range' => [
                    'from' => $from->toDateTimeString(),
                    'to' => $to->toDateTimeString(),
                ],
                'previous_range' => [
                    'from' => $prevFrom->toDateTimeString(),
                    'to' => $prevTo->toDateTimeString(),
                ],
                'current' => [
                    'cards' => $currentCards,
                ],
                'previous' => [
                    'cards' => $previousCards,
                ],
                'deltas' => $deltas,
                'timeseries' => $this->getTimeseries($from, $to, $filters),
                'pending_charges' => $this->getPendingCharges($from, $to, $filters),
            ];
        });
    }

    private function applyFilters($query, array $filters)
    {
        return $query->when(!empty($filters['status']), function ($q) use ($filters) {
            // Apply status filter. For appointments, use the table alias or directly if it's the root table
            // We use 'appointments.status' typically but we'll assume 'status' resolves to the root model.
            // When querying charges joined with appointments, ensure correct qualification.
            if ($q->getModel() instanceof Charge) {
                // If the model is a Charge joined with appointments, the status filter should apply to appointments
                // But the user requested generic status filter. Let's assume the user means Appointment status.
                $q->whereIn('appointments.status', $filters['status']);
            } else {
                $q->whereIn('status', $filters['status']);
            }
        })->when(!empty($filters['service_id']), function ($q) use ($filters) {
            $col = $q->getModel() instanceof Charge ? 'appointments.service_id' : 'service_id';
            $q->where($col, $filters['service_id']);
        })->when(!empty($filters['professional_id']), function ($q) use ($filters) {
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

        // Charges
        $chargesQuery = Charge::whereHas('appointment', function ($q) use ($from, $to, $filters) {
            $q->whereBetween('starts_at', [$from, $to]);
            // Apply filters to the appointment related to the charge
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

        // Charges requires manual join for `selectRaw` and filters
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
                'appointments' => $appointmentsDaily->get($dateString, 0),
                'revenue' => (float) $chargesDaily->get($dateString, 0),
            ];
        }

        return $timeseries;
    }

    private function getPendingCharges(Carbon $from, Carbon $to, array $filters)
    {
        $query = Charge::with('appointment.customer')
            ->whereIn('charges.status', ['pending', 'overdue'])
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

        return $query->orderBy('due_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($charge) {
                return [
                    'id' => $charge->id,
                    'customer_name' => collect($charge->appointment->customer)->get('name', 'Desconhecido'),
                    'amount' => (float) $charge->amount,
                    'status' => $charge->status,
                    'due_date' => $charge->due_date ? $charge->due_date->format('Y-m-d') : null,
                ];
            });
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
        
        foreach ($data['pending_charges'] as $charge) {
            $csv .= "{$charge['customer_name']},{$charge['amount']},{$charge['due_date']},{$charge['status']}\n";
        }
        
        return $csv;
    }
}
