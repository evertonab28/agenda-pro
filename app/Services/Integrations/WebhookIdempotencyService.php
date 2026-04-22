<?php

namespace App\Services\Integrations;

use App\Models\WebhookAudit;
use Illuminate\Support\Facades\DB;

class WebhookIdempotencyService
{
    public function handle(int $workspaceId, string $provider, string $type, string $eventId, callable $callback): string
    {
        return DB::transaction(function () use ($workspaceId, $provider, $type, $eventId, $callback) {
            $alreadyProcessed = $this->query($workspaceId, $provider, $type, $eventId)
                ->lockForUpdate()
                ->exists();

            if ($alreadyProcessed) {
                return 'already_processed';
            }

            $processed = (bool) $callback();

            if (!$processed) {
                return 'ignored';
            }

            if (!$this->query($workspaceId, $provider, $type, $eventId)->exists()) {
                WebhookAudit::create([
                    'workspace_id' => $workspaceId,
                    'provider' => $provider,
                    'type' => $type,
                    'event_id' => $eventId,
                    'processed_at' => now(),
                ]);
            }

            return 'processed';
        });
    }

    private function query(int $workspaceId, string $provider, string $type, string $eventId)
    {
        return WebhookAudit::where('workspace_id', $workspaceId)
            ->where('provider', $provider)
            ->where('type', $type)
            ->where('event_id', $eventId);
    }
}
