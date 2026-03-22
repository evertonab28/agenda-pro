<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
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
        // $this->authorize('viewAny', \App\Models\Charge::class);

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

        $cacheKey = "finance_metrics_{$startDate->format('Ymd')}_{$endDate->format('Ymd')}";
        
        $metrics = Cache::remember($cacheKey, 120, function () use ($startDate, $endDate) {
            return $this->financeService->getDashboardMetrics($startDate, $endDate);
        });

        // Gráficos (mocked for now, will implement later in FinanceService if needed)
        $chartData = [
            'dailyReceipts' => [], // To be implemented
            'paymentMethods' => [] // To be implemented
        ];

        return Inertia::render('Finance/Dashboard', [
            'metrics' => $metrics,
            'chartData' => $chartData,
            'filters' => $request->only(['period']),
        ]);
    }
}
