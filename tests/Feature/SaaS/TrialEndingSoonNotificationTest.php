<?php

namespace Tests\Feature\SaaS;

use App\DTOs\SaaS\CommercialEventPayload;
use App\Events\SaaS\TrialEndingSoon;
use App\Models\Workspace;
use App\Models\WorkspaceSubscriptionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrialEndingSoonNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_trial_ending_soon_is_logged_as_subscription_event()
    {
        $ws = Workspace::factory()->create();

        event(new TrialEndingSoon(new CommercialEventPayload(
            workspaceId: $ws->id,
            meta: ['days_left' => 3, 'trial_ends_at' => now()->addDays(3)->toDateString()]
        )));

        $this->assertDatabaseHas('workspace_subscription_events', [
            'workspace_id' => $ws->id,
            'event_type'   => 'trial_ending_soon',
        ]);
    }

    public function test_trial_ending_soon_resolves_message_for_multiple_days()
    {
        $ws = Workspace::factory()->create();
        $payload = new CommercialEventPayload(
            workspaceId: $ws->id,
            meta: ['days_left' => 7, 'trial_ends_at' => '2026-04-17']
        );
        $event = new TrialEndingSoon($payload);

        $handler = app(\App\Listeners\SaaS\SendCommercialNotification::class);
        $method  = new \ReflectionMethod($handler, 'resolveMessage');
        $method->setAccessible(true);
        $message = $method->invoke($handler, $event);

        $this->assertNotNull($message);
        $this->assertStringContainsString('7', $message);
        $this->assertStringContainsString('dias', $message);
    }

    public function test_trial_ending_today_resolves_urgent_message()
    {
        $ws = Workspace::factory()->create();
        $payload = new CommercialEventPayload(
            workspaceId: $ws->id,
            meta: ['days_left' => 0, 'trial_ends_at' => today()->toDateString()]
        );
        $event = new TrialEndingSoon($payload);

        $handler = app(\App\Listeners\SaaS\SendCommercialNotification::class);
        $method  = new \ReflectionMethod($handler, 'resolveMessage');
        $method->setAccessible(true);
        $message = $method->invoke($handler, $event);

        $this->assertNotNull($message);
        $this->assertStringContainsString('hoje', $message);
    }

    public function test_handle_sends_notification_via_messaging_service()
    {
        $ws = Workspace::factory()->create();
        \App\Models\User::factory()->create([
            'workspace_id' => $ws->id,
            'email'        => 'owner@test.com',
        ]);

        $payload = new CommercialEventPayload(
            workspaceId: $ws->id,
            meta: ['days_left' => 3, 'trial_ends_at' => '2026-04-14']
        );

        \Illuminate\Support\Facades\Log::shouldReceive('info')
            ->atLeast()->once();
        \Illuminate\Support\Facades\Log::shouldReceive('error')
            ->never();

        event(new TrialEndingSoon($payload));

        $this->assertDatabaseHas('workspace_subscription_events', [
            'workspace_id' => $ws->id,
            'event_type'   => 'trial_ending_soon',
        ]);
    }
}
