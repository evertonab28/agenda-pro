<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Charge;
use App\Services\FinanceService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class FinanceController extends Controller
{
    public function __construct(private FinanceService $financeService)
    {
    }

    public function dashboard(Request $request)
    {
        $this->authorize('viewAny', Charge::class);

        $period = $request->query('period', 'month');
        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        if ($period === 'week') {
            $startDate = Carbon::now()->startOfWeek();
            $endDate = Carbon::now()->endOfWeek();
        } elseif ($period === 'year') {
            $startDate = Carbon::now()->startOfYear();
            $endDate = Carbon::now()->endOfYear();
        }

        $ttl = (int) config('cache.finance_ttl', env('FINANCE_CACHE_TTL', 120));
        $cacheKey = "finance_metrics_{$startDate->format('Ymd')}_{$endDate->format('Ymd')}";

        $metrics = Cache::remember($cacheKey, $ttl, function () use ($startDate, $endDate) {
            return $this->financeService->getDashboardMetrics($startDate, $endDate);
        });

        $chartKey = "finance_charts_{$startDate->format('Ymd')}_{$endDate->format('Ymd')}";
        $chartData = Cache::remember($chartKey, $ttl, function () use ($startDate, $endDate) {
            return [
                'dailyReceipts'  => $this->financeService->getDailyReceipts($startDate, $endDate),
                'paymentMethods' => $this->financeService->getPaymentMethodBreakdown($startDate, $endDate),
            ];
        });

        return Inertia::render('Finance/Dashboard', [
            'metrics'   => $metrics,
            'chartData' => $chartData,
            'filters'   => $request->only(['period']),
        ]);
    }
}
