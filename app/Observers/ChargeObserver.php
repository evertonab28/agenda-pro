<?php

namespace App\Observers;

use App\Models\Charge;
use App\Services\CacheService;

class ChargeObserver
{
    public function saved(Charge $charge): void
    {
        $this->clearCache();
    }

    public function deleted(Charge $charge): void
    {
        $this->clearCache();
    }

    protected function clearCache(): void
    {
        CacheService::invalidateDashboard();
        CacheService::invalidateFinance();
    }
}
