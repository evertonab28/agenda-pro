<?php

namespace App\Console\Commands;

use App\Services\Retention\DunningService;
use App\Services\Retention\TrialConversionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessRetentionAndDunningOps extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'saas:retention-ops';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Processa regras de retenção, envia lembretes de Dunning e gerencia Trial expirations.';

    /**
     * Execute the console command.
     */
    public function handle(DunningService $dunningService, TrialConversionService $trialService)
    {
        $this->info('Iniciando processamento de Retention Ops...');
        
        $dunningStats = $dunningService->processReminders();
        $this->info("Dunning -> Upcoming: {$dunningStats['upcoming']} | Due Today: {$dunningStats['due_today']} | Overdue: {$dunningStats['overdue']}");
        
        $trialStats = $trialService->processTrialAlerts();
        $this->info("Trials -> 7 Days: {$trialStats['7_days']} | 3 Days: {$trialStats['3_days']} | Today: {$trialStats['today']}");
        
        Log::info('Retention Ops processado com sucesso.', ['dunning' => $dunningStats, 'trials' => $trialStats]);
        
        return self::SUCCESS;
    }
}
