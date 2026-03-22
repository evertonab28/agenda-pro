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
        //
    }
}
