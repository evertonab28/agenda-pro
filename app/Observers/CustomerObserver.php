<?php

namespace App\Observers;

use App\Models\Customer;
use App\Jobs\CRM\UpdateCustomerSegmentJob;

class CustomerObserver
{
    /**
     * Handle the Customer "created" event.
     */
    public function created(Customer $customer): void
    {
        UpdateCustomerSegmentJob::dispatch($customer);
    }
}
