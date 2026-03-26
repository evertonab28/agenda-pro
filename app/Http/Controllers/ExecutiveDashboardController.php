<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;

class ExecutiveDashboardController extends Controller
{
    public function index(\App\Http\Requests\DashboardFilterRequest $request, DashboardService $dashboardService)
    {
        $filters = $request->validated();
        
        return Inertia::render('Dashboard/Executive', [
            'heatmap' => $dashboardService->getOccupancyHeatmap($filters),
            'revenue' => $dashboardService->getRevenueComparison($filters),
            'noShowRanking' => $dashboardService->getNoShowRanking($filters),
            'retention' => $dashboardService->getRetentionMetrics($filters),
            'dailyActions' => $dashboardService->getDailyActions(),
            'filters' => $filters,
        ]);
    }
}
