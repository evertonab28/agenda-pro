<?php

namespace Tests\Unit\Services;

use App\DTOs\SaaS\CommercialEventPayload;
use App\Events\SaaS\TrialEndingSoon;
use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceSubscription;
use App\Services\Retention\TrialConversionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class TrialConversionServiceTest extends TestCase
{
    use RefreshDatabase;

    private TrialConversionService $service;
    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TrialConversionService();
        $this->plan = Plan::create([
            'name'          => 'Pro',
            'slug'          => 'pro',
            'price'         => 99.90,
            'billing_cycle' => 'monthly',
            'is_active'     => true,
            'features'      => [],
        ]);
    }

    public function test_fires_trial_ending_soon_with_valid_commercial_event_payload()
    {
        Event::fake([TrialEndingSoon::class]);

        $ws = Workspace::create(['name' => 'Trial WS', 'slug' => 'trial-ws']);
        WorkspaceSubscription::create([
            'workspace_id'   => $ws->id,
            'plan_id'        => $this->plan->id,
            'status'         => 'trialing',
            'trial_ends_at'  => now()->addDays(7)->toDateString(),
            'starts_at'      => now(),
        ]);

        $result = $this->service->processTrialAlerts();

        $this->assertEquals(1, $result['7_days']);

        Event::assertDispatched(TrialEndingSoon::class, function (TrialEndingSoon $event) use ($ws) {
            return $event->payload instanceof CommercialEventPayload
                && $event->payload->workspaceId === $ws->id
                && ($event->payload->meta['days_left'] ?? null) === 7;
        });
    }

    public function test_does_not_resend_alert_already_recorded()
    {
        $ws = Workspace::create(['name' => 'Trial WS2', 'slug' => 'trial-ws2']);
        WorkspaceSubscription::create([
            'workspace_id'  => $ws->id,
            'plan_id'       => $this->plan->id,
            'status'        => 'trialing',
            'trial_ends_at' => now()->addDays(3)->toDateString(),
            'starts_at'     => now(),
        ]);

        $result1 = $this->service->processTrialAlerts();
        $this->assertEquals(1, $result1['3_days']);

        $result2 = $this->service->processTrialAlerts();
        $this->assertEquals(0, $result2['3_days']);
    }

    public function test_processes_all_three_alert_thresholds()
    {
        $makeWs = fn(string $slug) => Workspace::create(['name' => $slug, 'slug' => $slug]);

        $ws7 = $makeWs('t-7d');
        WorkspaceSubscription::create([
            'workspace_id' => $ws7->id, 'plan_id' => $this->plan->id,
            'status' => 'trialing', 'trial_ends_at' => now()->addDays(7)->toDateString(),
            'starts_at' => now(),
        ]);

        $ws3 = $makeWs('t-3d');
        WorkspaceSubscription::create([
            'workspace_id' => $ws3->id, 'plan_id' => $this->plan->id,
            'status' => 'trialing', 'trial_ends_at' => now()->addDays(3)->toDateString(),
            'starts_at' => now(),
        ]);

        $ws0 = $makeWs('t-0d');
        WorkspaceSubscription::create([
            'workspace_id' => $ws0->id, 'plan_id' => $this->plan->id,
            'status' => 'trialing', 'trial_ends_at' => now()->toDateString(),
            'starts_at' => now(),
        ]);

        $result = $this->service->processTrialAlerts();

        $this->assertEquals(1, $result['7_days']);
        $this->assertEquals(1, $result['3_days']);
        $this->assertEquals(1, $result['today']);
    }
}
