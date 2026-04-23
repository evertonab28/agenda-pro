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
        // Teste de Diagnóstico
        return "Conexão com a rota Dashboard OK! Se você está vendo isso, o problema está nos dados do banco.";

        /*
        try {
            $filters = $request->validated();
            ...
        */
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