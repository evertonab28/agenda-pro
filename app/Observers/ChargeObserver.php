<?php

namespace App\Observers;

use App\Models\Charge;
use Illuminate\Support\Facades\Cache;

class ChargeObserver
{
    /**
     * Handle the Charge "saved" event.
     */
    public function saved(Charge $charge): void
    {
        $this->clearCache();
    }

    /**
     * Handle the Charge "deleted" event.
     */
    public function deleted(Charge $charge): void
    {
        $this->clearCache();
    }

    protected function clearCache(): void
    {
        // For now, simpler to flush since keys are date-dependent
        // In a high-traffic app, we'd use better tagging.
        Cache::flush(); 
    }
}
