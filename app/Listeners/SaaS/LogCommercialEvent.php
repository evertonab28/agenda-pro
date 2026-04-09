<?php

namespace App\Listeners\SaaS;

use App\Events\SaaS\CommercialEvent;
use App\Models\WorkspaceSubscriptionEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class LogCommercialEvent implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(CommercialEvent $event): void
    {
        try {
            WorkspaceSubscriptionEvent::create([
                'workspace_id'    => $event->workspaceId,
                'subscription_id' => $event->subscriptionId,
                'event_type'      => $event->getEventType(),
                'payload'         => $event->toCommercialPayload(),
            ]);

            Log::info("CommercialEventLogged: {$event->getEventType()} for workspace {$event->workspaceId}");
        } catch (\Exception $e) {
            Log::error("Failed to log commercial event: {$e->getMessage()}", [
                'event' => get_class($event),
                'workspace_id' => $event->workspaceId
            ]);
        }
    }
}
