<?php

namespace App\Events\SaaS;

class SubscriptionReactivated extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'subscription_reactivated';
    }
}
