<?php

namespace App\DTOs\SaaS;

readonly class CommercialEventPayload
{
    public function __construct(
        public int $workspaceId,
        public ?int $subscriptionId = null,
        public ?int $invoiceId = null,
        public ?int $planId = null,
        public ?int $previousPlanId = null,
        public float $amount = 0.0,
        public float $previousAmount = 0.0,
        public float $deltaAmount = 0.0,
        public ?int $actorId = null,
        public array $meta = [],
        public ?string $occurredAt = null,
    ) {}

    public function toArray(): array
    {
        return [
            'workspace_id'     => $this->workspaceId,
            'subscription_id'  => $this->subscriptionId,
            'invoice_id'       => $this->invoiceId,
            'plan_id'          => $this->planId,
            'previous_plan_id' => $this->previousPlanId,
            'amount'           => $this->amount,
            'previous_amount'  => $this->previousAmount,
            'delta_amount'     => $this->deltaAmount,
            'actor_id'         => $this->actorId,
            'occurred_at'      => $this->occurredAt ?? now()->toDateTimeString(),
            ...$this->meta
        ];
    }
}
