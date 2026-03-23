<?php

namespace App\Http\Controllers;

use App\Services\CRMService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CRMController extends Controller
{
    public function index(CRMService $crmService)
    {
        $avgNps = \App\Models\Appointment::whereNotNull('nps_score')->avg('nps_score');

        return Inertia::render('CRM/Index', [
            'stats' => $crmService->getSegmentCounts(),
            'avg_nps' => round($avgNps, 1),
            'segments' => [
                'VIP' => 'Clientes com mais de 10 visitas concluídas.',
                'Recorrente' => 'Clientes com 3 a 9 visitas concluídas.',
                'Ativo' => 'Visitou nos últimos 30 dias.',
                'Em Risco' => 'Não visita há mais de 30 dias.',
                'Inativo' => 'Não visita há mais de 60 dias.',
                'Novo' => 'Ainda não concluiu atendimentos.',
            ]
        ]);
    }

    public function segment(string $segment, CRMService $crmService)
    {
        $customers = $crmService->getCustomersBySegment($segment);

        return Inertia::render('CRM/SegmentReport', [
            'segment' => $segment,
            'customers' => $customers->values(),
        ]);
    }
}
