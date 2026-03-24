<?php

namespace App\Observers;

use App\Models\Receipt;
use App\Services\CacheService;

class ReceiptObserver
{
    /**
     * Handle the Receipt "saved" event.
     */
    public function saved(Receipt $receipt): void
    {
        CacheService::invalidateFinance();
        CacheService::invalidateDashboard();
    }

    /**
     * Handle the Receipt "deleted" event.
     */
    public function deleted(Receipt $receipt): void
    {
        CacheService::invalidateFinance();
        CacheService::invalidateDashboard();
    }
}
