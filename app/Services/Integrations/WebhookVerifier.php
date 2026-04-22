<?php

namespace App\Services\Integrations;

use Illuminate\Http\Request;

class WebhookVerifier
{
    public function verify(Request $request, string $payload, ?string $secret, string $provider): WebhookVerificationResult
    {
        if ($provider === 'evolution' && app()->environment('local', 'testing')) {
            return WebhookVerificationResult::valid();
        }

        if (empty($secret)) {
            return WebhookVerificationResult::invalid('Unauthorized signature');
        }

        $timestamp = $request->header('X-Webhook-Timestamp');

        if (!is_numeric($timestamp) || abs(time() - (int) $timestamp) > 300) {
            return WebhookVerificationResult::invalid('Request expirado (Timestamp drift)');
        }

        $signature = $request->header('X-Webhook-Signature', $request->header('asaas-signature'));
        $expectedSignature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

        if (hash_equals($expectedSignature, (string) $signature)) {
            return WebhookVerificationResult::valid();
        }

        if (hash_equals((string) $secret, (string) $signature)) {
            return WebhookVerificationResult::valid();
        }

        return WebhookVerificationResult::invalid('Unauthorized signature');
    }
}
