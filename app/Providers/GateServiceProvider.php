<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class GateServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Gate::before(function ($user, $ability) {
            if ($user->role === 'admin') {
                return true;
            }
        });

        // Policies
        Gate::policy(\App\Models\Charge::class,       \App\Policies\ChargePolicy::class);
        Gate::policy(\App\Models\Appointment::class,  \App\Policies\AppointmentPolicy::class);
        Gate::policy(\App\Models\User::class,         \App\Policies\UserPolicy::class);
        Gate::policy(\App\Models\Customer::class,     \App\Policies\CustomerPolicy::class);
        Gate::policy(\App\Models\Service::class,      \App\Policies\ServicePolicy::class);
        Gate::policy(\App\Models\Professional::class, \App\Policies\ProfessionalPolicy::class);
        Gate::policy(\App\Models\Holiday::class,      \App\Policies\HolidayPolicy::class);

        // Individual Gates
        Gate::define('export-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager']);
        });
        
        Gate::define('view-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager', 'operator']);
        });

        Gate::define('manage-settings', function (\App\Models\User $user) {
            return $user->role === 'admin';
        });
    }
}
