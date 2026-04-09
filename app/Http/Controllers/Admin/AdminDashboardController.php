<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SaasMetricsService;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function __construct(private SaasMetricsService $metrics) {}

    public function index()
    {
        return Inertia::render('Admin/Dashboard', [
            'stats'             => $this->metrics->getHealthMetrics(),
            'alerts'            => $this->metrics->getOperationalAlerts(),
            'at_risk'           => $this->metrics->getAtRiskWorkspaces(),
            'trial_metrics'     => $this->metrics->getTrialMetrics(),
            'recent_events'     => $this->metrics->getRecentEvents(10),
        ]);
    }
}
