<?php

namespace App\DTOs\SaaS;

readonly class BillingWorkspaceDTO
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $email = null,
        public ?string $document = null,
    ) {}
}
