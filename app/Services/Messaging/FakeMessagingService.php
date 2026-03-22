<?php

namespace App\Services\Messaging;

class FakeMessagingService implements MessagingServiceInterface
{
    public function send(string $to, string $message, array $meta = []): array
    {
        logger()->info('FAKE message sent', compact('to', 'message', 'meta'));

        return [
            'ok' => true,
            'provider_message_id' => 'fake_'.uniqid(),
        ];
    }
}
