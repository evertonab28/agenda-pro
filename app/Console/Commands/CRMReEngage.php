<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Workspace;
use App\Models\CRMAction;
use App\Services\CRMService;

class CRMReEngage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:re-engage';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Identify and generate re-engagement actions for inactive customers.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $workspaces = Workspace::all();
        $crmService = app(CRMService::class);

        $this->info('Starting CRM Re-engagement check...');

        foreach ($workspaces as $workspace) {
            $this->info("Checking workspace: {$workspace->name}");

            $inactiveCustomers = $crmService->reengageInactiveCustomers($workspace->id);

            foreach ($inactiveCustomers as $customerArray) {
                $customerId = $customerArray['id'];

                $exists = CRMAction::withoutGlobalScopes()
                    ->where('workspace_id', $workspace->id)
                    ->where('customer_id', $customerId)
                    ->where('type', 'reengagement')
                    ->where('status', 'pending')
                    ->exists();

                if (!$exists) {
                    CRMAction::create([
                        'workspace_id' => $workspace->id,
                        'customer_id' => $customerId,
                        'type' => 'reengagement',
                        'priority' => 'medium',
                        'title' => 'Cliente Inativo',
                        'description' => 'Cliente não realiza agendamentos há mais de 60 dias. Sugerido contato para re-engajamento.',
                        'action_data' => [
                            'days_inactive' => 60,
                            'suggested_action' => 'whatsapp_message'
                        ]
                    ]);

                    $this->line(" - Created action for customer ID: {$customerId}");
                }
            }
        }

        $this->info('CRM Re-engagement check completed.');
    }
}
