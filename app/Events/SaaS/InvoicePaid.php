<?php

namespace App\Events\SaaS;

class InvoicePaid extends CommercialEvent
{
    /**
     * Get the standardized event type name (slug).
     */
    public function getEventType(): string
    {
        return 'invoice_paid';
    }
}
