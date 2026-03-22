<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Messaging\MessagingServiceInterface;
use App\Services\Messaging\FakeMessagingService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(MessagingServiceInterface::class, FakeMessagingService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \App\Models\Appointment::observe(\App\Observers\AppointmentObserver::class);
        \App\Models\Charge::observe(\App\Observers\ChargeObserver::class);

        \Illuminate\Support\Facades\Gate::define('export-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager']);
        });
        
        \Illuminate\Support\Facades\Gate::define('view-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager', 'operator']);
        });
    }
}
