<?php

namespace App\Console\Commands\CRM;

use Illuminate\Console\Command;

class RecalculateSegments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:recalculate-segments';

    protected $description = 'Recalculate segments for all customers (useful for initial data and daily maintenance)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting CRM segment recalculation...');

        $query = \App\Models\Customer::withoutGlobalScopes();
        $total = $query->count();
        $bar = $this->output->createProgressBar($total);

        $query->chunk(500, function ($customers) use ($bar) {
            foreach ($customers as $customer) {
                \App\Jobs\CRM\UpdateCustomerSegmentJob::dispatch($customer);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->info("\nDone! Dispatched {$total} segment update jobs.");
    }
}
