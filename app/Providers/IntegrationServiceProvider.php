<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class IntegrationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
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
}
