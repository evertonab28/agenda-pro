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
    public function __construct(
        private SaasMetricsService $metrics,
        private \App\Services\Platform\PlatformReadService $platformRead
    ) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status'); // all|active|trialing|overdue|canceled|none
        $planId = $request->input('plan_id');

        $filters = [
            'search'  => $search,
            'status'  => $status,
            'plan_id' => $planId,
        ];

        $workspaces = $this->platformRead->getWorkspacesDataTable($filters, 25);

        return Inertia::render('Admin/Workspaces/Index', [
            'workspaces' => $workspaces,
            'filters'    => $filters,
            'plans' => \App\Models\Plan::orderBy('price')->get(['id', 'name', 'price'])->toArray(),
        ]);
    }

    public function show(int $id)
    {
        $workspace = $this->platformRead->getWorkspaceDetail($id);
        $workspace->load(['subscription.plan']);

        $invoices = $this->platformRead->getInvoicesByWorkspace($workspace->id)
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

        $usersCount     = $this->platformRead->getUserCounts(collect([$workspace->id]))->get($workspace->id, 0);
        $customersCount = $this->platformRead->getCustomerCounts(collect([$workspace->id]))->get($workspace->id, 0);

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
                'cancellation_category' => $workspace->subscription->cancellation_category,
                'cancellation_reason'   => $workspace->subscription->cancellation_reason,
                'winback_candidate'     => (bool) $workspace->subscription->winback_candidate,
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

    public function updateRetention(Request $request, int $id)
    {
        $validated = $request->validate([
            'cancellation_category' => 'nullable|string|max:255',
            'cancellation_reason'   => 'nullable|string',
            'winback_candidate'     => 'boolean',
        ]);

        $workspace = $this->platformRead->getWorkspaceDetail($id);
        $workspace->load(['subscription.plan']);

        if ($workspace->subscription) {
            $isFirstCancellation = !empty($validated['cancellation_category'])
                && !$workspace->subscription->cancellation_recorded_at;

            if ($isFirstCancellation) {
                $validated['cancellation_recorded_at'] = now();
                $validated['canceled_by'] = 'admin';
            }

            $workspace->subscription->update($validated);

            if (!empty($validated['cancellation_category'])) {
                event(new \App\Events\SaaS\CancellationReasonRecorded(
                    workspaceId: $workspace->id,
                    subscriptionId: $workspace->subscription->id,
                    planId: $workspace->subscription->plan_id,
                    amount: (float) ($workspace->subscription->plan?->price ?? 0),
                    actorId: auth()->id(),
                    meta: $validated
                ));

                // Emite subscription_canceled na primeira gravação para alimentar Revenue Movement
                if ($isFirstCancellation) {
                    event(new \App\Events\SaaS\SubscriptionCanceled(
                        workspaceId: $workspace->id,
                        subscriptionId: $workspace->subscription->id,
                        planId: $workspace->subscription->plan_id,
                        amount: (float) ($workspace->subscription->plan?->price ?? 0),
                        actorId: auth()->id(),
                        meta: [
                            'cancellation_category' => $validated['cancellation_category'],
                            'canceled_by'           => 'admin',
                        ]
                    ));
                }
            }
        }

        return redirect()->back()->with('success', 'Dados de retenção atualizados com sucesso.');
    }
}
