<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SaasMetricsService;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index(
        SaasMetricsService $metricsService, 
        \App\Services\Retention\RevenueOpsService $revenueOpsService,
        \App\Services\Platform\PlatformReadService $platformRead
    )
    {
        $stats = $metricsService->getHealthMetrics();
        $alerts = $metricsService->getOperationalAlerts();
        $trialMetrics = $metricsService->getTrialMetrics();
        $atRisk = $metricsService->getAtRiskWorkspaces();
        $recentEvents = $metricsService->getRecentEvents(15);
        $revenueMovements = $revenueOpsService->getRevenueMovements();
        
        // Buscando motivos de churn via Camada de Leitura da Plataforma
        $recentCancellations = $platformRead->getRecentCancellations(5);

        return inertia('Admin/Dashboard', [
            'stats'         => $stats,
            'alerts'        => $alerts,
            'trial_metrics' => $trialMetrics,
            'at_risk'       => $atRisk,
            'recent_events' => $recentEvents,
            'revenue_movements' => $revenueMovements,
            'recent_cancellations' => $recentCancellations,
        ]);
    }
}
