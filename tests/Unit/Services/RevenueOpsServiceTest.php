<?php

namespace Tests\Unit\Services;

use App\Models\Workspace;
use App\Models\WorkspaceSubscriptionEvent;
use App\Services\Retention\RevenueOpsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RevenueOpsServiceTest extends TestCase
{
    use RefreshDatabase;

    private RevenueOpsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RevenueOpsService();
    }

    private function logEvent(string $type, float $amount, float $delta = 0)
    {
        $ws = Workspace::create(['name' => 'W', 'slug' => uniqid()]);
        $plan = \App\Models\Plan::create([
            'name' => 'Starter', 'slug' => uniqid(), 'price' => 10, 'billing_cycle' => 'monthly', 'is_active' => true, 'features' => []
        ]);
        $sub = \App\Models\WorkspaceSubscription::create([
            'workspace_id' => $ws->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);
        
        WorkspaceSubscriptionEvent::create([
            'workspace_id' => $ws->id,
            'subscription_id' => $sub->id,
            'event_type' => $type,
            'payload' => [
                'amount' => $amount,
                'mrr_delta' => $delta,
            ],
        ]);
    }

    public function test_revenue_movements_calculates_correctly()
    {
        // 1 New Activation (+100)
        $this->logEvent('subscription_activated', 100);
        
        // 1 Expansion (+50)
        $this->logEvent('plan_changed', 150, 50);

        // 1 Contraction (-20)
        $this->logEvent('plan_changed', 80, -20);
        
        // 1 Churn (-99)
        $this->logEvent('subscription_canceled', 99);

        // 1 Recovery (+50)
        $this->logEvent('subscription_reactivated', 50);

        $results = $this->service->getRevenueMovements();
        $movements = $results['movements'];

        $this->assertEquals(100, $movements['new_mrr']);
        $this->assertEquals(50, $movements['expansion_mrr']);
        $this->assertEquals(20, $movements['contraction_mrr']); // always absolute
        $this->assertEquals(99, $movements['churned_mrr']);     // always absolute
        $this->assertEquals(50, $movements['recovered_mrr']);

        // Net movement = (100 + 50 + 50) - (20 + 99) = 200 - 119 = 81
        $this->assertEquals(81, $results['net_movement']);
    }
}
