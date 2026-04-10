<?php

namespace App\Events\SaaS;

class InvoiceOverdue extends CommercialEvent
{
    /**
     * Get the standardized event type name (slug).
     */
    public function getEventType(): string
    {
        return 'invoice_overdue';
    }
}
