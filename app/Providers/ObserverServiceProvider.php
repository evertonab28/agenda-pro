<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class ObserverServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        \App\Models\Appointment::observe(\App\Observers\AppointmentObserver::class);
        \App\Models\Charge::observe(\App\Observers\ChargeObserver::class);
        \App\Models\Receipt::observe(\App\Observers\ReceiptObserver::class);
        \App\Models\Workspace::observe(\App\Observers\WorkspaceObserver::class);
        \App\Models\Customer::observe(\App\Observers\CustomerObserver::class);
    }
}
