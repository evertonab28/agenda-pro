<?php

namespace App\Events\SaaS;

class SubscriptionActivated extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'subscription_activated';
    }
}
