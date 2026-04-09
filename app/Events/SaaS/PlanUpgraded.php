<?php

namespace App\Events\SaaS;

class PlanUpgraded extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'plan_upgraded';
    }
}
