<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;

class ExecutiveDashboardController extends Controller
{
    public function index(DashboardService $dashboardService)
    {
        return Inertia::render('Dashboard/Executive', [
            'heatmap' => $dashboardService->getOccupancyHeatmap(),
            'revenue' => $dashboardService->getRevenueComparison(),
            'noShowRanking' => $dashboardService->getNoShowRanking(),
            'retention' => $dashboardService->getRetentionMetrics(),
        ]);
    }
}
