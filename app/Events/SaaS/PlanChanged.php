<?php

namespace App\Events\SaaS;

class PlanChanged extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'plan_changed';
    }
}
