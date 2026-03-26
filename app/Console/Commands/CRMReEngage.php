<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Clinic; // Added by the change
use App\Models\CRMAction; // Added by the change
use App\Services\CRMService; // Added by the change

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
        $clinics = Clinic::all();
        $crmService = app(CRMService::class);

        $this->info('Starting CRM Re-engagement check...');

        foreach ($clinics as $clinic) {
            $this->info("Checking clinic: {$clinic->name}");
            
            $inactiveCustomers = $crmService->reengageInactiveCustomers($clinic->id);
            
            foreach ($inactiveCustomers as $customerArray) {
                $customerId = $customerArray['id'];
                
                $exists = CRMAction::withoutGlobalScopes()
                    ->where('clinic_id', $clinic->id)
                    ->where('customer_id', $customerId)
                    ->where('type', 'reengagement')
                    ->where('status', 'pending')
                    ->exists();

                if (!$exists) {
                    CRMAction::create([
                        'clinic_id' => $clinic->id,
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
