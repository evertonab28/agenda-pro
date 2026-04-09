<?php

namespace App\Events\SaaS;

class InvoiceGenerated extends CommercialEvent
{
    public function getEventType(): string
    {
        return 'invoice_generated';
    }
}
