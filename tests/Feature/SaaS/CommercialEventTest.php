<?php

namespace Tests\Feature\SaaS;

use App\Events\SaaS\SubscriptionActivated;
use App\Models\Workspace;
use App\Models\WorkspaceSubscription;
use App\Models\WorkspaceSubscriptionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CommercialEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_commercial_event_is_persisted_automatically()
    {
        $workspace = Workspace::factory()->create();
        $subscription = WorkspaceSubscription::factory()->create([
            'workspace_id' => $workspace->id
        ]);

        // Dispatch standardized event
        event(new SubscriptionActivated(
            workspaceId: $workspace->id,
            subscriptionId: $subscription->id,
            planId: $subscription->plan_id,
            amount: 99.90,
            meta: ['test_key' => 'test_value']
        ));

        // Wait (or assert database)
        // Since the listener is ShouldQueue (by default and in my implementation),
        // we might need to use sync queue for testing or just check if it worked
        // if the queue is sync in testing (usually it is in Laravel tests unless configured otherwise).

        $this->assertDatabaseHas('workspace_subscription_events', [
            'workspace_id' => $workspace->id,
            'event_type' => 'subscription_activated'
        ]);

        $event = WorkspaceSubscriptionEvent::where('workspace_id', $workspace->id)->first();
        $this->assertEquals(99.90, $event->payload['amount']);
        $this->assertEquals('test_value', $event->payload['test_key']);
        $this->assertNotNull($event->payload['occurred_at']);
    }

    public function test_plan_upgrade_payload_standardization()
    {
        $workspace = Workspace::factory()->create();
        $subscription = WorkspaceSubscription::factory()->create([
            'workspace_id' => $workspace->id
        ]);
        
        event(new \App\Events\SaaS\PlanUpgraded(
            workspaceId: $workspace->id,
            subscriptionId: $subscription->id,
            planId: 2,
            previousPlanId: 1,
            amount: 150.00,
            deltaAmount: 50.00
        ));

        $this->assertDatabaseHas('workspace_subscription_events', [
            'workspace_id' => $workspace->id,
            'event_type' => 'plan_upgraded'
        ]);

        $event = WorkspaceSubscriptionEvent::where('workspace_id', $workspace->id)->first();
        $this->assertEquals(2, $event->payload['plan_id']);
        $this->assertEquals(1, $event->payload['previous_plan_id']);
        $this->assertEquals(50.00, $event->payload['delta_amount']);
    }
}
