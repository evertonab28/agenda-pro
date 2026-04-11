<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class CommercialServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $commercialEvents = [
            \App\Events\SaaS\SubscriptionActivated::class,
            \App\Events\SaaS\SubscriptionRenewed::class,
            \App\Events\SaaS\SubscriptionReactivated::class,
            \App\Events\SaaS\PlanUpgraded::class,
            \App\Events\SaaS\InvoiceGenerated::class,
            \App\Events\SaaS\InvoicePaid::class,
            \App\Events\SaaS\InvoiceOverdue::class,
            \App\Events\SaaS\TrialEndingSoon::class,
            \App\Events\SaaS\InvoiceReminderSent::class,
            \App\Events\SaaS\SubscriptionCanceled::class,
            \App\Events\SaaS\CancellationReasonRecorded::class,
        ];

        foreach ($commercialEvents as $eventClass) {
            Event::listen($eventClass, \App\Listeners\SaaS\LogCommercialEvent::class);
        }

        // Domain Notifications
        Event::listen([
            \App\Events\SaaS\SubscriptionActivated::class,
            \App\Events\SaaS\InvoiceGenerated::class,
            \App\Events\SaaS\InvoicePaid::class,
            \App\Events\SaaS\InvoiceOverdue::class,
            \App\Events\SaaS\InvoiceReminderSent::class,
            \App\Events\SaaS\TrialEndingSoon::class,
        ], \App\Listeners\SaaS\SendCommercialNotification::class);
    }
}
