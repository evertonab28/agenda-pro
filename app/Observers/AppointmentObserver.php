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

    public function created(Appointment $model): void 
    { 
        $this->invalidateDashboard(); 
        \App\Jobs\CRM\UpdateCustomerSegmentJob::dispatch($model->customer);
    }

    public function updated(Appointment $model): void 
    { 
        $this->invalidateDashboard(); 

        if ($model->isDirty(['status', 'starts_at'])) {
            \App\Jobs\CRM\UpdateCustomerSegmentJob::dispatch($model->customer);
        }

        if ($model->isDirty('status') && $model->status === 'canceled') {
            app(\App\Services\CRMService::class)->triggerAppointmentCanceled($model);
        }
    }

    public function deleted(Appointment $model): void 
    { 
        $this->invalidateDashboard(); 
        \App\Jobs\CRM\UpdateCustomerSegmentJob::dispatch($model->customer);
    }
}
