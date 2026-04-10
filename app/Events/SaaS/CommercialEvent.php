<?php

namespace App\Events\SaaS;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use App\DTOs\SaaS\CommercialEventPayload;

abstract class CommercialEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public CommercialEventPayload $payload
    ) {}

    /**
     * Get the standardized event type name (slug).
     */
    abstract public function getEventType(): string;

    /**
     * Convert the event to a standardized payload for storage.
     */
    public function toCommercialPayload(): array
    {
        return $this->payload->toArray();
    }
}
