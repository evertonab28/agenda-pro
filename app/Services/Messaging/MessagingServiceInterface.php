<?php

namespace App\Services\Messaging;

interface MessagingServiceInterface
{
    public function send(string $to, string $message, array $meta = []): array;
}
