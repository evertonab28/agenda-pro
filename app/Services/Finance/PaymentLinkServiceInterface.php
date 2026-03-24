<?php

namespace App\Services\Finance;

use App\Models\Charge;

interface PaymentLinkServiceInterface
{
    /**
     * Generate a unique payment link for a given charge.
     */
    public function generate(Charge $charge): string;

    /**
     * Verify and process a payment link callback.
     */
    public function processCallback(array $payload): bool;
}
