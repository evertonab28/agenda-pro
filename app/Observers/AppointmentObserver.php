<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Services\CacheService;

class AppointmentObserver
{
    private function invalidateDashboard(): void
    {
        CacheService::invalidateDashboard();
    }

    public function created(Appointment $model): void { $this->invalidateDashboard(); }
    public function updated(Appointment $model): void { $this->invalidateDashboard(); }
    public function deleted(Appointment $model): void { $this->invalidateDashboard(); }
}
