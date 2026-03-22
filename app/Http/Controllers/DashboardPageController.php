<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Http\Requests\DashboardFilterRequest;
use App\Services\DashboardService;
use Illuminate\Support\Facades\Response;

class DashboardPageController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(DashboardFilterRequest $request)
    {
        $filters = $request->validated();

        if (!isset($filters['status'])) {
            $filters['status'] = [];
        }

        $dashboardData = $this->dashboardService->getDashboardData($filters);

        return Inertia::render('Dashboard/index', array_merge([
            'filters' => $filters,
        ], $dashboardData));
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
}