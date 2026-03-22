<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Charge;
use Illuminate\Support\Carbon;

class MarkChargesOverdue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:mark-overdue';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Marks pending charges with due date in the past as overdue.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today()->format('Y-m-d');
        
        $count = Charge::whereIn('status', ['pending', 'partial'])
            ->where('due_date', '<', $today)
            ->update(['status' => 'overdue']);
            
        $this->info("{$count} charge(s) marked as overdue.");
    }
}
