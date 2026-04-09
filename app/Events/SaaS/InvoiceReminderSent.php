<?php

namespace App\Events\SaaS;

class InvoiceReminderSent extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'reminder_sent';
    }
}
