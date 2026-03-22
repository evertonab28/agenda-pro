<?php

namespace App\Observers;

use App\Models\Appointment;
use Illuminate\Support\Facades\Cache;

class AppointmentObserver
{
    private function invalidateDashboard()
    {
        Cache::increment('dashboard_version');
    }

    public function created(Appointment $model) { $this->invalidateDashboard(); }
    public function updated(Appointment $model) { $this->invalidateDashboard(); }
    public function deleted(Appointment $model) { $this->invalidateDashboard(); }
}
