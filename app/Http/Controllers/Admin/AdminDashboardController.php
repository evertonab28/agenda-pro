<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // All queries bypass TenantScope — AdminUser has no workspace_id
        $totalWorkspaces = Workspace::withoutGlobalScopes()->count();

        $subscriptionsByStatus = WorkspaceSubscription::withoutGlobalScopes()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $activeCount   = $subscriptionsByStatus['active']   ?? 0;
        $trialingCount = $subscriptionsByStatus['trialing'] ?? 0;
        $overdueCount  = $subscriptionsByStatus['overdue']  ?? 0;
        $canceledCount = $subscriptionsByStatus['canceled'] ?? 0;

        // MRR: sum of paid invoices this month
        $mrr = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('status', 'paid')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->sum('amount');

        // Pending invoices value
        $pendingInvoicesValue = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->whereIn('status', ['pending', 'overdue'])
            ->sum('amount');

        // Trials expiring in 7 days
        $trialsExpiringSoon = WorkspaceSubscription::withoutGlobalScopes()
            ->with('workspace:id,name,slug')
            ->where('status', 'trialing')
            ->whereBetween('trial_ends_at', [now(), now()->addDays(7)])
            ->orderBy('trial_ends_at')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'workspace_name' => $s->workspace->name ?? '—',
                'workspace_id'   => $s->workspace_id,
                'trial_ends_at'  => $s->trial_ends_at?->toDateString(),
                'days_left'      => now()->diffInDays($s->trial_ends_at, false),
            ]);

        // Recent workspaces
        $recentWorkspaces = Workspace::withoutGlobalScopes()
            ->with(['subscription.plan'])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn($w) => [
                'id'         => $w->id,
                'name'       => $w->name,
                'slug'       => $w->slug,
                'created_at' => $w->created_at->toDateString(),
                'plan'       => $w->subscription?->plan?->name ?? 'Sem plano',
                'status'     => $w->subscription?->status ?? 'none',
            ]);

        // Overdue workspaces
        $overdueWorkspaces = WorkspaceSubscription::withoutGlobalScopes()
            ->with('workspace:id,name,slug')
            ->where('status', 'overdue')
            ->orderBy('ends_at')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'workspace_name' => $s->workspace->name ?? '—',
                'workspace_id'   => $s->workspace_id,
                'ends_at'        => $s->ends_at?->toDateString(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_workspaces'      => $totalWorkspaces,
                'active'                => $activeCount,
                'trialing'              => $trialingCount,
                'overdue'               => $overdueCount,
                'canceled'              => $canceledCount,
                'mrr'                   => (float) $mrr,
                'pending_invoices_value' => (float) $pendingInvoicesValue,
            ],
            'trials_expiring_soon' => $trialsExpiringSoon,
            'recent_workspaces'    => $recentWorkspaces,
            'overdue_workspaces'   => $overdueWorkspaces,
        ]);
    }
}
