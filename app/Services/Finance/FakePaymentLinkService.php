<?php

namespace App\Services\Finance;

use App\Models\Charge;
use Illuminate\Support\Str;

class FakePaymentLinkService implements PaymentLinkServiceInterface
{
    public function generate(Charge $charge): string
    {
        if ($charge->status === 'paid') {
            throw new \Exception('Cannot generate link for paid charge');
        }

        // Se houver alteração de valor ou re-geração manual, invalidamos o anterior
        // (Isso é implícito ao sobrescrever o hash e a expiração)
        
        $hash = Str::random(40);
        
        $charge->update([
            'payment_link_hash' => $hash,
            'payment_link_expires_at' => now()->addDays(7),
            'payment_provider_id' => 'fake_' . Str::uuid(),
            'payment_link_clicks' => 0, // Reset clicks on new link
        ]);

        return config('app.url') . "/pay/{$hash}";
    }

    public function processCallback(array $payload): bool
    {
        // Simula processamento de webhook de sucesso
        if (($payload['status'] ?? '') === 'paid') {
            $charge = Charge::where('payment_provider_id', $payload['id'] ?? '')->first();
            if ($charge) {
                $charge->update(['status' => 'paid', 'paid_at' => now()]);
                return true;
            }
        }

        return false;
    }
}
