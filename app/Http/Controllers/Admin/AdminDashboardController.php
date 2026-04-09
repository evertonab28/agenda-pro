<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SaasMetricsService;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index(SaasMetricsService $metricsService, \App\Services\Retention\RevenueOpsService $revenueOpsService)
    {
        $stats = $metricsService->getHealthMetrics();
        $alerts = $metricsService->getOperationalAlerts();
        $trialMetrics = $metricsService->getTrialMetrics();
        $atRisk = $metricsService->getAtRiskWorkspaces();
        $recentEvents = $metricsService->getRecentEvents(15);
        $revenueMovements = $revenueOpsService->getRevenueMovements();
        
        // Buscando motivos de churn para exibição inicial no dashboard
        $recentCancellations = \App\Models\WorkspaceSubscription::withoutGlobalScopes()
            ->with('workspace:id,name,slug')
            ->whereNotNull('canceled_at')
            ->latest('canceled_at')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'workspace_id' => $s->workspace_id,
                'workspace_name' => $s->workspace->name ?? '—',
                'canceled_at' => $s->canceled_at->toDateString(),
                'category' => $s->cancellation_category ?? 'Não informado',
                'reason' => $s->cancellation_reason,
            ]);

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
