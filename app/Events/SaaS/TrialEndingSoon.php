<?php

namespace App\Events\SaaS;

class TrialEndingSoon extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'trial_ending_soon';
    }
}
