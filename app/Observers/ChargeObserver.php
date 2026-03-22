<?php

namespace App\Observers;

use App\Models\Charge;
use Illuminate\Support\Facades\Cache;

class ChargeObserver
{
    private function invalidateDashboard()
    {
        Cache::increment('dashboard_version');
    }

    public function created(Charge $model) { $this->invalidateDashboard(); }
    public function updated(Charge $model) { $this->invalidateDashboard(); }
    public function deleted(Charge $model) { $this->invalidateDashboard(); }
}
