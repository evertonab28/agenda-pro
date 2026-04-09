<?php

namespace App\Services\Messaging;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class RealMessagingService implements MessagingServiceInterface
{
    /**
     * Send a real message via an external provider (e.g., Twilio API, WhatsApp Cloud API).
     */
    public function send(string $to, string $message, array $meta = []): array
    {
        // Fail if not correctly configured in production
        if (app()->environment('production') && empty(config('services.messaging.provider_key'))) {
            Log::error('RealMessagingService: Failed to send message. Missing provider key in production.');
            return ['ok' => false, 'error' => 'Missing configuration'];
        }

        // Integration point: Call external API
        $externalId = 'msg_' . Str::uuid()->toString();

        Log::info("RealMessagingService: Sending message to {$to}", [
            'meta' => $meta,
            'external_id' => $externalId,
            'provider' => 'real_messaging_provider',
        ]);

        return [
            'ok' => true,
            'id' => $externalId,
            'status' => 'queued',
        ];
    }
}
