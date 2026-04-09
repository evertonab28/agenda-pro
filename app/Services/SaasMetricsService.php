<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscription;
use App\Models\WorkspaceSubscriptionEvent;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * SaasMetricsService
 *
 * Centraliza o cálculo de métricas operacionais do próprio SaaS Agenda Pro.
 * Todas as queries usam withoutGlobalScopes() para ignorar o TenantScope.
 *
 * Métricas documentadas como indisponíveis:
 * - churn_rate real: requer snapshots históricos de assinaturas
 * - upgrade_count: requer evento 'plan_upgraded' no workspace_subscription_events
 * - trial_conversion_rate: estimado por assinaturas ativas com starts_at após trial
 */
class SaasMetricsService
{
    /**
     * Retorna todas as métricas de health do SaaS.
     */
    public function getHealthMetrics(): array
    {
        $subscriptionCounts = WorkspaceSubscription::withoutGlobalScopes()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $activeCount   = (int) ($subscriptionCounts['active']   ?? 0);
        $trialingCount = (int) ($subscriptionCounts['trialing'] ?? 0);
        $overdueCount  = (int) ($subscriptionCounts['overdue']  ?? 0);
        $canceledCount = (int) ($subscriptionCounts['canceled'] ?? 0);
        $totalWorkspaces = Workspace::withoutGlobalScopes()->count();

        // MRR correto: soma dos preços dos planos das assinaturas ATIVAS
        $mrr = WorkspaceSubscription::withoutGlobalScopes()
            ->where('status', 'active')
            ->join('plans', 'workspace_subscriptions.plan_id', '=', 'plans.id')
            ->sum('plans.price');

        // MRR trialing (projetado caso todos convertam)
        $mrrProjected = WorkspaceSubscription::withoutGlobalScopes()
            ->whereIn('status', ['active', 'trialing'])
            ->join('plans', 'workspace_subscriptions.plan_id', '=', 'plans.id')
            ->sum('plans.price');

        $arr = (float) $mrr * 12;

        // Invoices
        $invoiceStats = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $pendingCount  = (int)   ($invoiceStats['pending']  ?->count ?? 0);
        $pendingValue  = (float) ($invoiceStats['pending']  ?->total ?? 0);
        $overdueInvCount = (int) ($invoiceStats['overdue']  ?->count ?? 0);
        $overdueInvValue = (float) ($invoiceStats['overdue'] ?->total ?? 0);
        $paidMtd       = (float) ($invoiceStats['paid']     ?->total ?? 0); // alternativa via invoices

        // Receita real do mês (invoices pagas no mês atual)
        $revenueMtd = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        // Trial conversion rate: workspaces que saíram do trial para active
        // Proxy: assinaturas active com starts_at não nulo (foram ativadas após trial)
        $convertedCount = WorkspaceSubscription::withoutGlobalScopes()
            ->where('status', 'active')
            ->whereNotNull('starts_at')
            ->count();

        $allTrialsEver = WorkspaceSubscription::withoutGlobalScopes()
            ->whereNotNull('trial_ends_at')
            ->count();

        $trialConversionRate = $allTrialsEver > 0
            ? round(($convertedCount / $allTrialsEver) * 100, 1)
            : null; // null = não há dados suficientes

        // Churn: count de cancelamentos (não é churn rate por falta de snapshots históricos)
        $churnCount = $canceledCount;

        // Workspaces sem assinatura
        $withoutSubscription = Workspace::withoutGlobalScopes()
            ->whereDoesntHave('subscriptions')
            ->count();

        return [
            'total_workspaces'       => $totalWorkspaces,
            'active_count'           => $activeCount,
            'trialing_count'         => $trialingCount,
            'overdue_count'          => $overdueCount,
            'canceled_count'         => $canceledCount,
            'without_subscription'   => $withoutSubscription,
            'mrr'                    => (float) $mrr,
            'mrr_projected'          => (float) $mrrProjected,
            'arr'                    => $arr,
            'revenue_mtd'            => (float) $revenueMtd,
            'pending_invoices_count' => $pendingCount,
            'pending_invoices_value' => $pendingValue,
            'overdue_invoices_count' => $overdueInvCount,
            'overdue_invoices_value' => $overdueInvValue,
            'trial_conversion_rate'  => $trialConversionRate,
            'churn_count'            => $churnCount,
        ];
    }

    /**
     * Métricas de trials: expirando em breve, convertidos, perdidos.
     */
    public function getTrialMetrics(): array
    {
        $expiringSoon = WorkspaceSubscription::withoutGlobalScopes()
            ->with('workspace:id,name,slug')
            ->where('status', 'trialing')
            ->whereBetween('trial_ends_at', [now(), now()->addDays(7)])
            ->orderBy('trial_ends_at')
            ->get()
            ->map(fn($s) => [
                'workspace_id'   => $s->workspace_id,
                'workspace_name' => $s->workspace->name ?? '—',
                'workspace_slug' => $s->workspace->slug ?? '—',
                'trial_ends_at'  => $s->trial_ends_at?->toDateString(),
                'days_left'      => (int) now()->diffInDays($s->trial_ends_at, false),
                'plan_id'        => $s->plan_id,
            ]);

        $expiredTrials = WorkspaceSubscription::withoutGlobalScopes()
            ->where('status', 'trialing')
            ->where('trial_ends_at', '<', now())
            ->count();

        return [
            'expiring_soon'  => $expiringSoon,
            'expired_trials' => $expiredTrials,
        ];
    }

    /**
     * Aglomerado de alertas operacionais.
     * Retorna array de alertas com level (danger/warning/info), tipo e dados.
     */
    public function getOperationalAlerts(): array
    {
        $alerts = [];

        // Alerta: invoices overdue com valor alto
        $overdueValue = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('status', 'overdue')
            ->sum('amount');
        $overdueCount = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('status', 'overdue')
            ->count();

        if ($overdueCount > 0) {
            $alerts[] = [
                'level'   => $overdueValue > 500 ? 'danger' : 'warning',
                'type'    => 'overdue_invoices',
                'message' => "{$overdueCount} invoice(s) vencida(s) totalizando R$ " . number_format($overdueValue, 2, ',', '.'),
                'count'   => $overdueCount,
                'value'   => (float) $overdueValue,
            ];
        }

        // Alerta: workspaces overdue
        $overdueWorkspaces = WorkspaceSubscription::withoutGlobalScopes()
            ->where('status', 'overdue')
            ->count();

        if ($overdueWorkspaces > 0) {
            $alerts[] = [
                'level'   => $overdueWorkspaces >= 3 ? 'danger' : 'warning',
                'type'    => 'overdue_workspaces',
                'message' => "{$overdueWorkspaces} workspace(s) com assinatura inadimplente",
                'count'   => $overdueWorkspaces,
                'value'   => null,
            ];
        }

        // Alerta: trials expirando em menos de 3 dias
        $criticalTrials = WorkspaceSubscription::withoutGlobalScopes()
            ->where('status', 'trialing')
            ->whereBetween('trial_ends_at', [now(), now()->addDays(3)])
            ->count();

        if ($criticalTrials > 0) {
            $alerts[] = [
                'level'   => 'warning',
                'type'    => 'trials_expiring_critical',
                'message' => "{$criticalTrials} trial(s) expira(m) em menos de 3 dias",
                'count'   => $criticalTrials,
                'value'   => null,
            ];
        }

        // Alerta: trials expirados sem conversão (virou dunning silencioso)
        $expiredTrials = WorkspaceSubscription::withoutGlobalScopes()
            ->where('status', 'trialing')
            ->where('trial_ends_at', '<', now())
            ->count();

        if ($expiredTrials > 0) {
            $alerts[] = [
                'level'   => 'danger',
                'type'    => 'expired_trials_not_dunned',
                'message' => "{$expiredTrials} trial(s) expirado(s) sem processamento de dunning — verificar scheduler",
                'count'   => $expiredTrials,
                'value'   => null,
            ];
        }

        // Alerta: workspaces sem assinatura
        $noSub = Workspace::withoutGlobalScopes()
            ->whereDoesntHave('subscriptions')
            ->count();

        if ($noSub > 0) {
            $alerts[] = [
                'level'   => 'info',
                'type'    => 'workspaces_no_subscription',
                'message' => "{$noSub} workspace(s) sem assinatura registrada",
                'count'   => $noSub,
                'value'   => null,
            ];
        }

        return $alerts;
    }

    /**
     * Eventos comerciais recentes (últimos N) — todos os workspaces.
     */
    public function getRecentEvents(int $limit = 15): array
    {
        return WorkspaceSubscriptionEvent::withoutGlobalScopes()
            ->with('workspace:id,name,slug')
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn($e) => [
                'id'             => $e->id,
                'workspace_id'   => $e->workspace_id,
                'workspace_name' => $e->workspace->name ?? '—',
                'event_type'     => $e->event_type,
                'payload'        => $e->payload,
                'created_at'     => $e->created_at->toDateTimeString(),
            ])
            ->toArray();
    }

    /**
     * Timeline comercial completa de um workspace específico.
     * Combina eventos de assinatura + invoices em ordem cronológica.
     */
    public function getWorkspaceTimeline(int $workspaceId): array
    {
        $events = WorkspaceSubscriptionEvent::withoutGlobalScopes()
            ->where('workspace_id', $workspaceId)
            ->orderBy('created_at')
            ->get()
            ->map(fn($e) => [
                'date'       => $e->created_at->toDateTimeString(),
                'source'     => 'event',
                'event_type' => $e->event_type,
                'payload'    => $e->payload,
                'amount'     => null,
                'status'     => null,
            ]);

        $invoices = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('workspace_id', $workspaceId)
            ->with('plan:id,name')
            ->orderBy('created_at')
            ->get()
            ->map(fn($i) => [
                'date'       => $i->created_at->toDateTimeString(),
                'source'     => 'invoice',
                'event_type' => $i->status === 'pending' ? 'invoice_generated' : 'invoice_' . $i->status,
                'payload'    => [
                    'plan'             => $i->plan?->name,
                    'reference_period' => $i->reference_period,
                    'due_date'         => $i->due_date?->toDateString(),
                    'paid_at'          => $i->paid_at?->toDateTimeString(),
                ],
                'amount' => (float) $i->amount,
                'status' => $i->status,
            ]);

        return $events->concat($invoices)
            ->sortBy('date')
            ->values()
            ->toArray();
    }

    /**
     * Workspaces em risco (overdue + trials expirando em <= 7 dias).
     */
    public function getAtRiskWorkspaces(): array
    {
        $overdue = WorkspaceSubscription::withoutGlobalScopes()
            ->with('workspace:id,name,slug', 'plan:id,name,price')
            ->where('status', 'overdue')
            ->orderBy('ends_at')
            ->get()
            ->map(fn($s) => [
                'workspace_id'   => $s->workspace_id,
                'workspace_name' => $s->workspace->name ?? '—',
                'workspace_slug' => $s->workspace->slug ?? '—',
                'risk'           => 'overdue',
                'plan'           => $s->plan->name ?? '—',
                'amount_at_risk' => (float) ($s->plan->price ?? 0),
                'since'          => $s->ends_at?->toDateString(),
            ]);

        $expiringTrials = WorkspaceSubscription::withoutGlobalScopes()
            ->with('workspace:id,name,slug', 'plan:id,name,price')
            ->where('status', 'trialing')
            ->whereBetween('trial_ends_at', [now(), now()->addDays(7)])
            ->orderBy('trial_ends_at')
            ->get()
            ->map(fn($s) => [
                'workspace_id'   => $s->workspace_id,
                'workspace_name' => $s->workspace->name ?? '—',
                'workspace_slug' => $s->workspace->slug ?? '—',
                'risk'           => 'trial_expiring',
                'plan'           => $s->plan->name ?? '—',
                'amount_at_risk' => (float) ($s->plan->price ?? 0),
                'since'          => $s->trial_ends_at?->toDateString(),
            ]);

        return $overdue->concat($expiringTrials)->values()->toArray();
    }
}
