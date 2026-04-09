<?php

namespace App\Events\SaaS;

class CancellationReasonRecorded extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'cancellation_reason_recorded';
    }
}
