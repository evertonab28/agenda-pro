<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Models\Receipt;
use App\Services\ReportingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    protected $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    public function index(Request $request)
    {
        $clinicId = $request->user()->clinic_id;

        return Inertia::render('Finance/Reports', [
            'financialTrend' => $this->reportingService->getFinancialTrend($clinicId),
            'servicePerformance' => $this->reportingService->getServicePerformance($clinicId),
            'customerInsights' => $this->reportingService->getCustomerInsights($clinicId),
        ]);
    }

    public function exportCsv(Request $request)
    {
        $type = $request->input('type', 'charges');
        $clinicId = $request->user()->clinic_id;
        $fileName = $type . '_export_' . now()->format('Y-m-d') . '.csv';

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use ($type, $clinicId) {
            $file = fopen('php://output', 'w');
            
            if ($type === 'charges') {
                fputcsv($file, ['ID', 'Cliente', 'Valor', 'Vencimento', 'Status']);
                Charge::where('clinic_id', $clinicId)->chunk(100, function ($charges) use ($file) {
                    foreach ($charges as $charge) {
                        fputcsv($file, [
                            $charge->id,
                            $charge->customer->name ?? 'N/A',
                            $charge->amount,
                            $charge->due_date->format('Y-m-d'),
                            $charge->status
                        ]);
                    }
                });
            } else {
                fputcsv($file, ['ID', 'Cliente', 'Valor Recebido', 'Data Pagamento', 'Método']);
                Receipt::where('clinic_id', $clinicId)->chunk(100, function ($receipts) use ($file) {
                    foreach ($receipts as $receipt) {
                        fputcsv($file, [
                            $receipt->id,
                            $receipt->charge->customer->name ?? 'N/A',
                            $receipt->amount_received,
                            $receipt->received_at->format('Y-m-d'),
                            $receipt->method
                        ]);
                    }
                });
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
