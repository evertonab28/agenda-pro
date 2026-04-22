<?php

namespace App\Services\Integrations;

class WebhookVerificationResult
{
    private function __construct(
        public readonly bool $valid,
        public readonly string $message = '',
        public readonly int $status = 401,
    ) {
    }

    public static function valid(): self
    {
        return new self(true);
    }

    public static function invalid(string $message, int $status = 401): self
    {
        return new self(false, $message, $status);
    }
}
