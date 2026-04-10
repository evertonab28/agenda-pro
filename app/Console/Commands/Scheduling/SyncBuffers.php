<?php

namespace App\Console\Commands\Scheduling;

use Illuminate\Console\Command;

class SyncBuffers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scheduling:sync-buffers';

    protected $description = 'Sync buffered_ends_at column for all existing appointments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting buffered_ends_at synchronization...');

        $appointments = \App\Models\Appointment::with('service')->get();
        $bar = $this->output->createProgressBar($appointments->count());

        foreach ($appointments as $appointment) {
            // Re-saving triggers the observer's saving event
            $appointment->save();
            $bar->advance();
        }

        $bar->finish();
        $this->info("\nDone! Synchronized {$appointments->count()} appointments.");
    }
}
