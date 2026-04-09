<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ProcessRecurringBilling extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'saas:billing-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gera faturas de renovação antecipadas para assinaturas ativas.';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\Billing\WorkspaceBillingService $billingService)
    {
        $subscriptions = \App\Models\WorkspaceSubscription::where('status', 'active')
            ->where('ends_at', '<=', now()->addDays(5))
            ->get();

        $this->info("Encontradas " . $subscriptions->count() . " assinaturas para análise de renovação.");

        foreach ($subscriptions as $sub) {
            $nextPeriod = $sub->ends_at->copy()->addDay()->format('m/Y');
            
            // Verifica se já existe uma fatura gerada para este workspace no próximo período
            $exists = \App\Models\WorkspaceBillingInvoice::where('workspace_id', $sub->workspace_id)
                ->where('reference_period', $nextPeriod)
                ->whereIn('status', ['pending', 'paid'])
                ->exists();

            if (!$exists) {
                $this->info("Gerando fatura de renovação para o workspace: {$sub->workspace->name} (Período: {$nextPeriod})");
                $billingService->createInvoice($sub->workspace, $sub->plan, 'renewal', $nextPeriod);
            } else {
                $this->info("Fatura já existe para o workspace: {$sub->workspace->name} no período {$nextPeriod}. Ignorando.");
            }
        }

        $this->info("Processamento de faturamento recorrente concluído.");
    }
}
