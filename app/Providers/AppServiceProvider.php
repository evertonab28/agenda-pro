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
        $this->app->bind(\App\Services\Finance\PaymentLinkServiceInterface::class, function ($app) {
            $provider = config('services.payment.provider', 'fake');
            if ($provider === 'fake' || $app->environment('testing')) {
                return new \App\Services\Finance\FakePaymentLinkService();
            }
            return new \App\Services\Finance\RealPaymentProviderService();
        });

        $this->app->bind(\App\Services\Messaging\MessagingServiceInterface::class, function ($app) {
            $provider = config('services.messaging.provider', 'fake');
            if ($provider === 'fake' || $app->environment('testing')) {
                return new \App\Services\Messaging\FakeMessagingService();
            }
            return new \App\Services\Messaging\RealMessagingService();
        });
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

        \Illuminate\Support\Facades\Gate::policy(\App\Models\Charge::class,       \App\Policies\ChargePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Appointment::class,  \App\Policies\AppointmentPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\User::class,         \App\Policies\UserPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Customer::class,     \App\Policies\CustomerPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Service::class,      \App\Policies\ServicePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Professional::class, \App\Policies\ProfessionalPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Holiday::class,      \App\Policies\HolidayPolicy::class);


        \App\Models\Appointment::observe(\App\Observers\AppointmentObserver::class);
        \App\Models\Charge::observe(\App\Observers\ChargeObserver::class);
        \App\Models\Receipt::observe(\App\Observers\ReceiptObserver::class);

        \Illuminate\Support\Facades\Gate::define('export-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager']);
        });
        
        \Illuminate\Support\Facades\Gate::define('view-dashboard', function (\App\Models\User $user) {
            return in_array($user->role ?? 'admin', ['admin', 'manager', 'operator']);
        });

        \Illuminate\Support\Facades\Gate::define('manage-settings', function (\App\Models\User $user) {
            return $user->role === 'admin';
        });
    }
}
