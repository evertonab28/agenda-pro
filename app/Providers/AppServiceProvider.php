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
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user->role === 'admin') {
                return true;
            }
        });

        \Illuminate\Support\Facades\Gate::policy(\App\Models\Charge::class, \App\Policies\ChargePolicy::class);

        \App\Models\Appointment::observe(\App\Observers\AppointmentObserver::class);
        \App\Models\Charge::observe(\App\Observers\ChargeObserver::class);
        \App\Models\Receipt::observe(\App\Observers\ReceiptObserver::class);

        \Illuminate\Support\Facades\Gate::define('export-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager']);
        });
        
        \Illuminate\Support\Facades\Gate::define('view-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager', 'operator']);
        });
    }
}
