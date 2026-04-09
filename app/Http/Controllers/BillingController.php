<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Models\User;
use App\Models\Plan;
use App\Models\WorkspaceBillingInvoice;
use App\Services\Billing\WorkspaceBillingService;
use App\Services\Subscription\SubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('manage-settings');

        $workspace = $request->user()->workspace;
        $subscription = $workspace->subscription()->with('plan')->first();
        
        $subscriptionService = app(SubscriptionService::class);

        // Calcular uso atual vs limites
        $stats = [
            'professionals' => [
                'current' => $workspace->professionals()->count(),
                'limit' => $subscriptionService->getLimit($workspace, 'max_professionals', 0),
            ],
            'users' => [
                'current' => $workspace->users()->count(),
                'limit' => $subscriptionService->getLimit($workspace, 'max_users', 0),
            ],
        ];

        $invoices = $workspace->billingInvoices()
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->get();

        $availablePlans = Plan::where('is_active', true)->get();

        return Inertia::render('Configurations/Billing/Index', [
            'subscription' => $subscription,
            'stats' => $stats,
            'invoices' => $invoices,
            'availablePlans' => $availablePlans,
        ]);
    }

    public function upgrade(Request $request, WorkspaceBillingService $billingService)
    {
        $this->authorize('manage-settings');

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $workspace = $request->user()->workspace;
        $plan = Plan::findOrFail($request->plan_id);

        try {
            $invoice = $billingService->createInvoice($workspace, $plan, 'upgrade');
            
            return back()->with('success', 'Fatura de upgrade gerada! Use o link de pagamento para ativar seu novo plano.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao gerar fatura: ' . $e->getMessage());
        }
    }
}
