<?php

namespace App\Jobs\CRM;

use App\Models\Customer;
use App\Services\CRMService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateCustomerSegmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Customer $customer
    ) {}

    /**
     * Execute the job.
     */
    public function handle(CRMService $crmService): void
    {
        $segment = $crmService->getSegment($this->customer);
        
        $this->customer->update([
            'current_segment' => $segment
        ]);
    }
}
