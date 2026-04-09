<?php

namespace App\Events\SaaS;

class SubscriptionCanceled extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'subscription_canceled';
    }
}
