<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ProcessOverdueSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'saas:billing-dunning';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Identifica assinaturas e trials vencidos e marca como overdue.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // 1. Assinaturas Ativas que venceram (ends_at < now)
        $expiredActive = \App\Models\WorkspaceSubscription::where('status', 'active')
            ->where('ends_at', '<', now())
            ->get();

        $this->info("Assinaturas ativas vencidas: " . $expiredActive->count());

        foreach ($expiredActive as $sub) {
            $sub->update(['status' => 'overdue']);
            $sub->events()->create([
                'workspace_id' => $sub->workspace_id,
                'event_type' => 'overdue',
                'payload' => ['reason' => 'cycle_ended', 'ends_at' => $sub->ends_at->toDateTimeString()]
            ]);
            $this->warn("Workspace [{$sub->workspace->name}] marcado como overdue.");
        }

        // 2. Trials que venceram (trial_ends_at < now)
        $expiredTrials = \App\Models\WorkspaceSubscription::where('status', 'trialing')
            ->where('trial_ends_at', '<', now())
            ->get();

        $this->info("Trials vencidos: " . $expiredTrials->count());

        foreach ($expiredTrials as $sub) {
            $sub->update(['status' => 'overdue']);
            $sub->events()->create([
                'workspace_id' => $sub->workspace_id,
                'event_type' => 'trial_ended',
                'payload' => ['trial_ends_at' => $sub->trial_ends_at->toDateTimeString()]
            ]);
            $this->warn("Workspace [{$sub->workspace->name}] trial finalizado e bloqueado.");
        }

        $this->info("Processamento de dunning concluído.");
    }
}
