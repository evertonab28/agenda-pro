<?php

namespace App\Services\Retention;

use App\Models\WorkspaceSubscription;
use App\Models\WorkspaceSubscriptionEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TrialConversionService
{
    /**
     * Processa workspaces com trials terminando.
     */
    public function processTrialAlerts(): array
    {
        $processed = [
            '7_days' => 0,
            '3_days' => 0,
            'today'  => 0,
        ];

        DB::transaction(function () use (&$processed) {
            $processed['7_days'] = $this->sendAlerts(7);
            $processed['3_days'] = $this->sendAlerts(3);
            $processed['today']  = $this->sendAlerts(0);
        });

        return $processed;
    }

    private function sendAlerts(int $daysLeft): int
    {
        $count = 0;
        
        $subscriptions = WorkspaceSubscription::withoutGlobalScopes()
            ->where('status', 'trialing')
            ->whereNotNull('trial_ends_at')
            ->whereDate('trial_ends_at', now()->addDays($daysLeft)->toDateString())
            ->get();

        foreach ($subscriptions as $sub) {
            if ($this->hasSentAlert($sub, $daysLeft)) continue;
            
            $this->recordAlert($sub, $daysLeft);
            // TODO: Envio de e-mail ao lead para converter
            $count++;
        }

        return $count;
    }

    private function hasSentAlert(WorkspaceSubscription $sub, int $daysLeft): bool
    {
        return WorkspaceSubscriptionEvent::withoutGlobalScopes()
            ->where('workspace_id', $sub->workspace_id)
            ->where('subscription_id', $sub->id)
            ->where('event_type', 'trial_ending_soon')
            ->whereJsonContains('payload->days_left', $daysLeft)
            ->exists();
    }

    private function recordAlert(WorkspaceSubscription $sub, int $daysLeft): void
    {
        event(new \App\Events\SaaS\TrialEndingSoon(
            workspaceId: $sub->workspace_id,
            subscriptionId: $sub->id,
            planId: $sub->plan_id,
            meta: [
                'days_left' => $daysLeft,
                'trial_ends_at' => $sub->trial_ends_at?->toDateString(),
            ]
        ));
        
        Log::info("TrialOps: sent {$daysLeft}_days alert for workspace {$sub->workspace_id}");
    }
}
