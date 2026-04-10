<?php

namespace App\Services\Platform;

use App\Models\Workspace;
use App\Models\WorkspaceSubscription;
use App\Models\WorkspaceBillingInvoice;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PlatformReadService
{
    /**
     * Get a paginated list of workspaces with counts and subscription data.
     */
    public function getWorkspacesDataTable(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        $search = $filters['search'] ?? null;
        $status = $filters['status'] ?? null;
        $planId = $filters['plan_id'] ?? null;

        $query = Workspace::withoutGlobalScopes()
            ->with(['subscription.plan'])
            ->when($search, fn($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%"))
            ->when($status && $status !== 'all', function ($q) use ($status) {
                if ($status === 'none') {
                    $q->whereDoesntHave('subscriptions');
                } elseif ($status === 'ending_trial') {
                    $q->whereHas('subscription', fn($q2) => $q2->where('status', 'trialing')->whereBetween('trial_ends_at', [now(), now()->addDays(7)]));
                } elseif ($status === 'canceled_recently') {
                    $q->whereHas('subscription', fn($q2) => $q2->whereNotNull('canceled_at')->whereBetween('canceled_at', [now()->subDays(30), now()]));
                } elseif ($status === 'winback') {
                    $q->whereHas('subscription', fn($q2) => $q2->where('winback_candidate', true));
                } else {
                    $q->whereHas('subscription', fn($q2) => $q2->where('status', $status));
                }
            })
            ->when($planId, fn($q) => $q->whereHas('subscription', fn($q2) => $q2->where('plan_id', $planId)))
            ->latest();

        $paginator = $query->paginate($perPage);
        $workspaceIds = $paginator->getCollection()->pluck('id');

        // Batch load counts and metadata
        $userCounts = $this->getUserCounts($workspaceIds);
        $customerCounts = $this->getCustomerCounts($workspaceIds);
        $lastInvoices = $this->getLastInvoices($workspaceIds);

        return $paginator->through(fn($w) => [
            'id'              => $w->id,
            'name'            => $w->name,
            'slug'            => $w->slug,
            'created_at'      => $w->created_at->toDateString(),
            'users_count'     => $userCounts->get($w->id, 0),
            'customers_count' => $customerCounts->get($w->id, 0),
            'plan'            => $w->subscription?->plan?->name ?? '—',
            'plan_price'      => (float) ($w->subscription?->plan?->price ?? 0),
            'status'          => $w->subscription?->status ?? 'none',
            'ends_at'         => $w->subscription?->ends_at?->toDateString(),
            'trial_ends_at'   => $w->subscription?->trial_ends_at?->toDateString(),
            'last_invoice'    => $lastInvoices->has($w->id) ? [
                'status'   => $lastInvoices[$w->id]->status,
                'amount'   => (float) $lastInvoices[$w->id]->amount,
                'due_date' => $lastInvoices[$w->id]->due_date?->toDateString(),
            ] : null,
        ]);
    }

    /**
     * Get detail of a specific workspace bypassing tenant scope.
     */
    public function getWorkspaceDetail(int $id): Workspace
    {
        return Workspace::withoutGlobalScopes()->findOrFail($id);
    }

    /**
     * Get invoices for a specific workspace bypassing tenant scope.
     */
    public function getInvoicesByWorkspace(int $workspaceId): Collection
    {
        return WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('workspace_id', $workspaceId)
            ->with('plan:id,name')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get recent cancellations bypassing tenant scope.
     */
    public function getRecentCancellations(int $limit = 5): Collection
    {
        return WorkspaceSubscription::withoutGlobalScopes()
            ->with('workspace:id,name,slug')
            ->whereNotNull('canceled_at')
            ->latest('canceled_at')
            ->take($limit)
            ->get()
            ->map(fn($s) => [
                'workspace_id'   => $s->workspace_id,
                'workspace_name' => $s->workspace->name ?? '—',
                'canceled_at'    => $s->canceled_at->toDateString(),
                'category'       => $s->cancellation_category ?? 'Não informado',
                'reason'         => $s->cancellation_reason,
            ]);
    }

    public function getUserCounts(Collection $workspaceIds): Collection
    {
        return User::withoutGlobalScopes()
            ->whereIn('workspace_id', $workspaceIds)
            ->selectRaw('workspace_id, count(*) as total')
            ->groupBy('workspace_id')
            ->pluck('total', 'workspace_id');
    }

    public function getCustomerCounts(Collection $workspaceIds): Collection
    {
        return Customer::withoutGlobalScopes()
            ->whereIn('workspace_id', $workspaceIds)
            ->selectRaw('workspace_id, count(*) as total')
            ->groupBy('workspace_id')
            ->pluck('total', 'workspace_id');
    }

    public function getLastInvoices(Collection $workspaceIds): Collection
    {
        // For performance, we get all recent invoices for these workspaces and pick the first per group
        return WorkspaceBillingInvoice::withoutGlobalScopes()
            ->whereIn('workspace_id', $workspaceIds)
            ->select('workspace_id', 'status', 'amount', 'due_date', 'created_at')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('workspace_id')
            ->map(fn($g) => $g->first());
    }
}
