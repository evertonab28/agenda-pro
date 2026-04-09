<?php

namespace App\Services\Retention;

use App\Models\WorkspaceSubscriptionEvent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class RevenueOpsService
{
    /**
     * Calcula as movimentações de MRR no mês corrente (ou período passado).
     */
    public function getRevenueMovements(Carbon $startDate = null, Carbon $endDate = null): array
    {
        $startDate = $startDate ?? now()->startOfMonth();
        $endDate = $endDate ?? now()->endOfMonth();

        $events = WorkspaceSubscriptionEvent::withoutGlobalScopes()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('event_type', [
                'subscription_activated',
                'subscription_reactivated',
                'subscription_canceled',
                'plan_changed',
                'plan_upgraded', // Se houver split explícito
            ])
            ->get();

        $movements = [
            'new_mrr' => 0.0,
            'expansion_mrr' => 0.0,
            'contraction_mrr' => 0.0,
            'churned_mrr' => 0.0,
            'recovered_mrr' => 0.0,
        ];

        foreach ($events as $event) {
            $payload = $event->payload;
            $amount = (float) ($payload['amount'] ?? $payload['price'] ?? 0);
            $delta = (float) ($payload['mrr_delta'] ?? 0);

            switch ($event->event_type) {
                case 'subscription_activated':
                    $movements['new_mrr'] += max(0, $amount);
                    break;

                case 'subscription_reactivated':
                    $movements['recovered_mrr'] += max(0, $amount);
                    break;

                case 'subscription_canceled':
                    $movements['churned_mrr'] += max(0, $amount); // Assume que o payload envia o valor perdido
                    break;

                case 'plan_upgraded':
                    $movements['expansion_mrr'] += max(0, $amount);
                    break;

                case 'plan_changed':
                    if ($delta > 0) {
                        $movements['expansion_mrr'] += $delta;
                    } elseif ($delta < 0) {
                        $movements['contraction_mrr'] += abs($delta);
                    }
                    break;
            }
        }

        // Calcula o Net MRR Movement
        $net = $movements['new_mrr'] 
             + $movements['expansion_mrr'] 
             + $movements['recovered_mrr'] 
             - $movements['contraction_mrr'] 
             - $movements['churned_mrr'];

        return [
            'movements' => $movements,
            'net_movement' => $net,
            'period' => $startDate->format('M Y'),
        ];
    }
}
