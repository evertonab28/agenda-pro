<?php

namespace App\Http\Controllers;

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

        $stats = [
            'professionals' => [
                'current' => $workspace->professionals()->count(),
                'limit'   => $subscriptionService->getLimit($workspace, 'max_professionals', 0),
            ],
            'users' => [
                'current' => $workspace->users()->count(),
                'limit'   => $subscriptionService->getLimit($workspace, 'max_users', 0),
            ],
        ];

        $invoices = $workspace->billingInvoices()
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->get();

        $availablePlans = Plan::where('is_active', true)->get();

        return Inertia::render('Configurations/Billing/Index', [
            'subscription'   => $subscription,
            'stats'          => $stats,
            'invoices'       => $invoices,
            'availablePlans' => $availablePlans,
        ]);
    }

    /**
     * Conversão de trial → mesmo plano já associado (trial_conversion).
     * Apenas workspaces em status 'trialing' podem usar esta ação.
     */
    public function activate(Request $request, WorkspaceBillingService $billingService)
    {
        $this->authorize('manage-settings');

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $workspace    = $request->user()->workspace;
        $subscription = $workspace->subscription()->first();

        if (!$subscription || $subscription->status !== 'trialing') {
            return back()->with('error', 'Esta ação só está disponível para assinaturas em período de trial.');
        }

        if ((int) $subscription->plan_id !== (int) $request->plan_id) {
            return back()->with('error', 'Para trocar de plano, use a opção de upgrade.');
        }

        $plan = Plan::findOrFail($request->plan_id);

        try {
            $billingService->createInvoice($workspace, $plan, 'trial_conversion');

            return back()->with('success', "Fatura gerada! Use o link de pagamento para ativar o plano {$plan->name}.");
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao gerar fatura: ' . $e->getMessage());
        }
    }

    /**
     * Upgrade para plano diferente (trialing ou active).
     * Bloqueado quando o plano selecionado é o mesmo e o status é 'trialing'.
     */
    public function upgrade(Request $request, WorkspaceBillingService $billingService)
    {
        $this->authorize('manage-settings');

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $workspace    = $request->user()->workspace;
        $subscription = $workspace->subscription()->first();

        // Guard: trial no mesmo plano deve usar /ativar
        if (
            $subscription &&
            $subscription->status === 'trialing' &&
            (int) $subscription->plan_id === (int) $request->plan_id
        ) {
            return back()->with('error', 'Você está em trial neste plano. Use "Assinar plano" para ativar a assinatura paga.');
        }

        $plan = Plan::findOrFail($request->plan_id);

        try {
            $billingService->createInvoice($workspace, $plan, 'upgrade');

            return back()->with('success', 'Fatura de upgrade gerada! Use o link de pagamento para ativar seu novo plano.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao gerar fatura: ' . $e->getMessage());
        }
    }

    public function cancel(Request $request)
    {
        $this->authorize('manage-settings');

        $workspace    = $request->user()->workspace;
        $subscription = $workspace->subscription()->first();

        if (!$subscription || $subscription->status === 'canceled') {
            return back()->with('error', 'Nenhuma assinatura ativa para cancelar.');
        }

        $subscription->update([
            'status'      => 'canceled',
            'canceled_at' => now(),
        ]);

        $subscription->events()->create([
            'workspace_id' => $workspace->id,
            'event_type'   => 'canceled',
            'payload'      => [
                'ends_at' => $subscription->ends_at?->toDateTimeString(),
            ],
        ]);

        return back()->with('success', 'Sua assinatura foi cancelada e não será renovada. Você manterá acesso até o fim do período atual.');
    }
}
