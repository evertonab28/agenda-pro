<?php

namespace App\Events\SaaS;

class SubscriptionRenewed extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'subscription_renewed';
    }
}
