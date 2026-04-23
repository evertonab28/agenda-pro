<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Http\Requests\DashboardFilterRequest;
use App\Services\DashboardService;
use App\Services\CRMService;
use Illuminate\Support\Facades\Response;

class DashboardPageController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService,
        protected CRMService $crmService,
    ) {}

    public function index(\Illuminate\Http\Request $request)
    {
        $workspace = auth()->user()->workspace;
        $officialAppUrl = 'https://app.agendanexo.com.br';
        $publicBookingUrl = $workspace
            ? $officialAppUrl . '/p/' . $workspace->slug
            : '';

        $whatsAppConnected = $workspace
            ? $workspace->integrations()
                ->where('provider', 'evolution')
                ->where('status', 'active')
                ->exists()
            : false;

        $segmentCounts = $this->crmService->getSegmentCounts();
        $atRiskCount = ($segmentCounts['Em Risco'] ?? 0) + ($segmentCounts['Inativo'] ?? 0);

        return \Inertia\Inertia::render('Dashboard/index', [
            'filters' => [],
            'dashboardData' => [],
            'atRiskCount' => $atRiskCount,
            'whatsAppConnected' => $whatsAppConnected,
            'publicBookingUrl' => $publicBookingUrl,
            'can_export' => true
        ]);
    }

    public function export(DashboardFilterRequest $request)
    {
        $filters = $request->validated();
        
        if (!isset($filters['status'])) {
            $filters['status'] = [];
        }

        $dashboardData = $this->dashboardService->getDashboardData($filters);
        
        $csvContent = $this->dashboardService->generateCsv($dashboardData);
        
        $filename = 'dashboard-' . now()->format('Ymd-Hi') . '.csv';

        return Response::make($csvContent, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function dayDetails(string $date, DashboardFilterRequest $request)
    {
        try {
            $parsedDate = \Carbon\Carbon::createFromFormat('Y-m-d', $date);
            if (!$parsedDate || $parsedDate->format('Y-m-d') !== $date) {
                return response()->json(['message' => 'Invalid date format. Expected YYYY-MM-DD.'], 422);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid date format. Expected YYYY-MM-DD.'], 422);
        }

        $filters = $request->validated();
        
        if (!isset($filters['status'])) {
            $filters['status'] = [];
        }

        return response()->json(
            $this->dashboardService->getDayDetails($date, $filters)
        );
    }
}