<?php

namespace App\Services\Finance;

use App\Models\Charge;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Services\Finance\PaymentLinkServiceInterface;

class RealPaymentProviderService implements PaymentLinkServiceInterface
{
    /**
     * Generate a unique payment link for a given charge using a real PSP (e.g. Stripe, MercadoPago).
     */
    public function generate(Charge $charge): string
    {
        // Integration point: Call external API, such as Stripe / MercadoPago
        // e.g., $response = Http::post('api.stripe.com/...', [...])
        // Here we simulate the external API call and the return of an external ID.

        $externalId = 'ext_' . Str::uuid()->toString();
        $hash = hash('sha256', $charge->id . $externalId . config('app.key'));

        $charge->update([
            'payment_link_hash' => $hash,
            'payment_link_expires_at' => now()->addDays(2),
            'payment_provider_id' => $externalId,
        ]);

        Log::info("Generated REAL payment link for Charge {$charge->id}", [
            'workspace_id' => $charge->workspace_id,
            'amount' => $charge->amount,
            'provider' => 'real_provider',
            'external_id' => $externalId
        ]);

        return route('payment.direct', $hash);
    }

    /**
     * Verify and process a payment link callback.
     */
    public function processCallback(array $payload): bool
    {
        if (empty($payload['id']) || empty($payload['status'])) {
            Log::warning('RealPaymentProvider: Invalid callback payload received', ['payload' => $payload]);
            return false;
        }

        $externalId = $payload['id'];
        $charge = Charge::where('payment_provider_id', $externalId)->first();

        if (!$charge) {
            Log::warning("RealPaymentProvider: Charge with external id {$externalId} not found.");
            return false;
        }

        if ($payload['status'] === 'paid' && $charge->status !== 'paid') {
            app(\App\Services\FinanceService::class)->markChargePaid($charge, [
                'method' => 'external',
                'paid_at' => now(),
                'notes' => "Recebimento sintetico via webhook provider ({$externalId}).",
            ]);

            Log::info("RealPaymentProvider: Charge {$charge->id} marked as paid via callback.");
            return true;
        }

        return false;
    }
}
