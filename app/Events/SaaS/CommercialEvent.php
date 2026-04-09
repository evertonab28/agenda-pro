<?php

namespace App\Events\SaaS;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class CommercialEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

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
        public ?string $occurredAt = null
    ) {
        $this->occurredAt = $occurredAt ?? now()->toDateTimeString();
    }

    /**
     * Get the standardized event type name (slug).
     */
    abstract public function getEventType(): string;

    /**
     * Convert the event to a standardized payload for storage.
     */
    public function toCommercialPayload(): array
    {
        return array_merge([
            'workspace_id'     => $this->workspaceId,
            'subscription_id'  => $this->subscriptionId,
            'invoice_id'       => $this->invoiceId,
            'plan_id'          => $this->planId,
            'previous_plan_id' => $this->previousPlanId,
            'amount'           => (float) $this->amount,
            'previous_amount'  => (float) $this->previousAmount,
            'delta_amount'     => (float) $this->deltaAmount,
            'actor_id'         => $this->actorId,
            'occurred_at'      => $this->occurredAt,
        ], $this->meta);
    }
}
