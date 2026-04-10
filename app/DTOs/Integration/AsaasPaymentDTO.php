<?php

namespace App\DTOs\Integration;

readonly class AsaasPaymentDTO
{
    public function __construct(
        public string $id,
        public string $status,
        public string $invoiceUrl,
        public string $dueDate,
        public float $amount,
        public ?string $description = null,
        public ?string $externalReference = null,
    ) {}

    public static function fromAsaasResponse(array $data): self
    {
        return new self(
            id: $data['id'],
            status: $data['status'],
            invoiceUrl: $data['invoiceUrl'],
            dueDate: $data['dueDate'],
            amount: (float) $data['value'],
            description: $data['description'] ?? null,
            externalReference: $data['externalReference'] ?? null,
        );
    }
}
