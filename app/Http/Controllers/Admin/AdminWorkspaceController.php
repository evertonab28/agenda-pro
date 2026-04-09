<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminWorkspaceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $workspacesQuery = Workspace::withoutGlobalScopes()
            ->with(['subscription.plan'])
            ->when($search, fn($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%"))
            ->latest();

        $paginator = $workspacesQuery->paginate(20);

        // Build workspace IDs for manual counting (bypasses TenantScope)
        $ids = $paginator->getCollection()->pluck('id');

        $userCounts = User::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->selectRaw('workspace_id, count(*) as total')
            ->groupBy('workspace_id')
            ->pluck('total', 'workspace_id');

        $customerCounts = Customer::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->selectRaw('workspace_id, count(*) as total')
            ->groupBy('workspace_id')
            ->pluck('total', 'workspace_id');

        $workspaces = $paginator->through(fn($w) => [
            'id'              => $w->id,
            'name'            => $w->name,
            'slug'            => $w->slug,
            'created_at'      => $w->created_at->toDateString(),
            'users_count'     => $userCounts->get($w->id, 0),
            'customers_count' => $customerCounts->get($w->id, 0),
            'plan'            => $w->subscription?->plan?->name ?? '—',
            'status'          => $w->subscription?->status ?? 'none',
            'ends_at'         => $w->subscription?->ends_at?->toDateString(),
            'trial_ends_at'   => $w->subscription?->trial_ends_at?->toDateString(),
        ]);

        return Inertia::render('Admin/Workspaces/Index', [
            'workspaces' => $workspaces,
            'filters'    => ['search' => $search],
        ]);
    }

    public function show(int $id)
    {
        // Bypass getRouteKeyName() (slug) and TenantScope by using explicit lookup
        $workspace = Workspace::withoutGlobalScopes()->findOrFail($id);
        $workspace->load(['subscription.plan', 'subscription.events']);

        $invoices = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('workspace_id', $workspace->id)
            ->with('plan:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($i) => [
                'id'                    => $i->id,
                'amount'                => (float) $i->amount,
                'status'                => $i->status,
                'due_date'              => $i->due_date?->toDateString(),
                'reference_period'      => $i->reference_period,
                'plan_name'             => $i->plan?->name ?? '—',
                'provider_payment_link' => $i->provider_payment_link,
                'created_at'            => $i->created_at->toDateString(),
            ]);

        $events = ($workspace->subscription?->events ?? collect())
            ->sortByDesc('created_at')
            ->values()
            ->map(fn($e) => [
                'id'         => $e->id,
                'event_type' => $e->event_type,
                'payload'    => $e->payload,
                'created_at' => $e->created_at->toDateTimeString(),
            ]);

        $usersCount     = User::withoutGlobalScopes()->where('workspace_id', $workspace->id)->count();
        $customersCount = Customer::withoutGlobalScopes()->where('workspace_id', $workspace->id)->count();

        return Inertia::render('Admin/Workspaces/Show', [
            'workspace' => [
                'id'              => $workspace->id,
                'name'            => $workspace->name,
                'slug'            => $workspace->slug,
                'created_at'      => $workspace->created_at->toDateString(),
                'users_count'     => $usersCount,
                'customers_count' => $customersCount,
            ],
            'subscription' => $workspace->subscription ? [
                'id'            => $workspace->subscription->id,
                'status'        => $workspace->subscription->status,
                'starts_at'     => $workspace->subscription->starts_at?->toDateString(),
                'ends_at'       => $workspace->subscription->ends_at?->toDateString(),
                'trial_ends_at' => $workspace->subscription->trial_ends_at?->toDateString(),
                'canceled_at'   => $workspace->subscription->canceled_at?->toDateString(),
                'plan'          => [
                    'name'          => $workspace->subscription->plan?->name ?? '—',
                    'price'         => (float) ($workspace->subscription->plan?->price ?? 0),
                    'billing_cycle' => $workspace->subscription->plan?->billing_cycle ?? '—',
                ],
            ] : null,
            'invoices' => $invoices,
            'events'   => $events,
        ]);
    }
}
