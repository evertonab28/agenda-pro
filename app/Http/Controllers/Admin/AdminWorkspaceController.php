<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Services\SaasMetricsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminWorkspaceController extends Controller
{
    public function __construct(private SaasMetricsService $metrics) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status'); // all|active|trialing|overdue|canceled|none
        $planId = $request->input('plan_id');

        $query = Workspace::withoutGlobalScopes()
            ->with(['subscription.plan'])
            ->when($search, fn($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%"))
            ->when($status && $status !== 'all', function ($q) use ($status) {
                if ($status === 'none') {
                    $q->whereDoesntHave('subscriptions');
                } else {
                    $q->whereHas('subscription', fn($q2) => $q2->where('status', $status));
                }
            })
            ->when($planId, fn($q) => $q->whereHas('subscription', fn($q2) => $q2->where('plan_id', $planId)))
            ->latest();

        $paginator = $query->paginate(25);
        $ids = $paginator->getCollection()->pluck('id');

        // Contagens manuais (bypassa TenantScope)
        $userCounts     = User::withoutGlobalScopes()->whereIn('workspace_id', $ids)->selectRaw('workspace_id, count(*) as total')->groupBy('workspace_id')->pluck('total', 'workspace_id');
        $customerCounts = Customer::withoutGlobalScopes()->whereIn('workspace_id', $ids)->selectRaw('workspace_id, count(*) as total')->groupBy('workspace_id')->pluck('total', 'workspace_id');

        // Última invoice por workspace
        $lastInvoices = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->whereIn('workspace_id', $ids)
            ->select('workspace_id', 'status', 'amount', 'due_date')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('workspace_id')
            ->map(fn($g) => $g->first());

        $workspaces = $paginator->through(fn($w) => [
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

        return Inertia::render('Admin/Workspaces/Index', [
            'workspaces' => $workspaces,
            'filters'    => [
                'search'  => $search,
                'status'  => $status,
                'plan_id' => $planId,
            ],
            'plans' => \App\Models\Plan::orderBy('price')->get(['id', 'name', 'price'])->toArray(),
        ]);
    }

    public function show(int $id)
    {
        $workspace = Workspace::withoutGlobalScopes()->findOrFail($id);
        $workspace->load(['subscription.plan']);

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
                'paid_at'               => $i->paid_at?->toDateString(),
                'reference_period'      => $i->reference_period,
                'plan_name'             => $i->plan?->name ?? '—',
                'provider_payment_link' => $i->provider_payment_link,
                'created_at'            => $i->created_at->toDateString(),
            ]);

        $timeline = $this->metrics->getWorkspaceTimeline($workspace->id);

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
            'timeline' => $timeline,
        ]);
    }
}
