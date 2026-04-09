<?php

namespace Tests\Unit\Services;

use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscription;
use App\Models\WorkspaceSubscriptionEvent;
use App\Services\SaasMetricsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaasMetricsServiceTest extends TestCase
{
    use RefreshDatabase;

    private SaasMetricsService $service;
    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SaasMetricsService();

        $this->plan = Plan::create([
            'name'          => 'Starter Test',
            'slug'          => 'starter-test',
            'price'         => 49.90,
            'billing_cycle' => 'monthly',
            'is_active'     => true,
            'features'      => [],
        ]);
    }

    private function makeWorkspace(string $suffix = ''): Workspace
    {
        return Workspace::create(['name' => "WS {$suffix}", 'slug' => "ws-{$suffix}"]);
    }

    private function makeSubscription(Workspace $ws, string $status, array $extra = []): WorkspaceSubscription
    {
        return WorkspaceSubscription::create(array_merge([
            'workspace_id' => $ws->id,
            'plan_id'      => $this->plan->id,
            'status'       => $status,
            'starts_at'    => now(),
            'ends_at'      => now()->addMonth(),
        ], $extra));
    }

    /* ─── Health Metrics ─────────────────────────────────────────────── */

    public function test_counts_workspaces_by_status()
    {
        $ws1 = $this->makeWorkspace('a');
        $ws2 = $this->makeWorkspace('b');
        $ws3 = $this->makeWorkspace('c');
        $ws4 = $this->makeWorkspace('d');

        $this->makeSubscription($ws1, 'active');
        $this->makeSubscription($ws2, 'trialing', ['trial_ends_at' => now()->addDays(7), 'starts_at' => null]);
        $this->makeSubscription($ws3, 'overdue');
        $this->makeSubscription($ws4, 'canceled');

        $metrics = $this->service->getHealthMetrics();

        $this->assertEquals(4, $metrics['total_workspaces']);
        $this->assertEquals(1, $metrics['active_count']);
        $this->assertEquals(1, $metrics['trialing_count']);
        $this->assertEquals(1, $metrics['overdue_count']);
        $this->assertEquals(1, $metrics['canceled_count']);
    }

    public function test_mrr_uses_plan_price_of_active_subscriptions_only()
    {
        $ws1 = $this->makeWorkspace('mrr1');
        $ws2 = $this->makeWorkspace('mrr2');
        $ws3 = $this->makeWorkspace('mrr3');

        $this->makeSubscription($ws1, 'active');  // +49.90
        $this->makeSubscription($ws2, 'active');  // +49.90
        $this->makeSubscription($ws3, 'trialing', ['trial_ends_at' => now()->addDays(7), 'starts_at' => null]); // não entra no MRR

        $metrics = $this->service->getHealthMetrics();

        $this->assertEquals(99.80, round($metrics['mrr'], 2));
        $this->assertEquals(0.0,   round($metrics['revenue_mtd'], 2)); // nenhuma invoice paga
    }

    public function test_arr_is_mrr_times_12()
    {
        $ws = $this->makeWorkspace('arr');
        $this->makeSubscription($ws, 'active');

        $metrics = $this->service->getHealthMetrics();
        $this->assertEqualsWithDelta($metrics['mrr'] * 12, $metrics['arr'], 0.01);
    }

    public function test_pending_and_overdue_invoice_counts()
    {
        $ws = $this->makeWorkspace('inv');
        $sub = $this->makeSubscription($ws, 'active');

        WorkspaceBillingInvoice::create([
            'workspace_id' => $ws->id, 'subscription_id' => $sub->id,
            'plan_id' => $this->plan->id, 'amount' => 49.90,
            'status' => 'pending', 'due_date' => now()->addDays(5),
            'reference_period' => '2026-04',
        ]);
        WorkspaceBillingInvoice::create([
            'workspace_id' => $ws->id, 'subscription_id' => $sub->id,
            'plan_id' => $this->plan->id, 'amount' => 49.90,
            'status' => 'overdue', 'due_date' => now()->subDays(5),
            'reference_period' => '2026-03',
        ]);

        $metrics = $this->service->getHealthMetrics();

        $this->assertEquals(1, $metrics['pending_invoices_count']);
        $this->assertEquals(1, $metrics['overdue_invoices_count']);
        $this->assertEqualsWithDelta(49.90, $metrics['pending_invoices_value'], 0.01);
        $this->assertEqualsWithDelta(49.90, $metrics['overdue_invoices_value'], 0.01);
    }

    public function test_workspace_without_subscription_counted()
    {
        $this->makeWorkspace('nosub');
        $metrics = $this->service->getHealthMetrics();
        $this->assertEquals(1, $metrics['without_subscription']);
    }

    /* ─── Alert System ───────────────────────────────────────────────── */

    public function test_no_alerts_when_everything_is_fine()
    {
        $ws = $this->makeWorkspace('ok');
        $this->makeSubscription($ws, 'active');

        $alerts = $this->service->getOperationalAlerts();
        $this->assertEmpty($alerts);
    }

    public function test_alert_fires_for_overdue_invoices()
    {
        $ws = $this->makeWorkspace('ov');
        $sub = $this->makeSubscription($ws, 'overdue');

        WorkspaceBillingInvoice::create([
            'workspace_id' => $ws->id, 'subscription_id' => $sub->id,
            'plan_id' => $this->plan->id, 'amount' => 49.90,
            'status' => 'overdue', 'due_date' => now()->subDays(10),
            'reference_period' => '2026-03',
        ]);

        $alerts = $this->service->getOperationalAlerts();
        $types  = array_column($alerts, 'type');

        $this->assertContains('overdue_invoices', $types);
        $this->assertContains('overdue_workspaces', $types);
    }

    public function test_alert_fires_for_expiring_trial_critical()
    {
        $ws = $this->makeWorkspace('critial-trial');
        $this->makeSubscription($ws, 'trialing', [
            'trial_ends_at' => now()->addDays(2),
            'starts_at'     => null,
        ]);

        $alerts = $this->service->getOperationalAlerts();
        $types  = array_column($alerts, 'type');

        $this->assertContains('trials_expiring_critical', $types);
    }

    public function test_alert_fires_for_expired_trial_not_dunned()
    {
        $ws = $this->makeWorkspace('expired-trial');
        $this->makeSubscription($ws, 'trialing', [
            'trial_ends_at' => now()->subDays(3), // expirado e não processado
            'starts_at'     => null,
        ]);

        $alerts = $this->service->getOperationalAlerts();
        $types  = array_column($alerts, 'type');

        $this->assertContains('expired_trials_not_dunned', $types);
    }

    /* ─── Timeline ───────────────────────────────────────────────────── */

    public function test_workspace_timeline_combines_events_and_invoices()
    {
        $ws  = $this->makeWorkspace('tl');
        $sub = $this->makeSubscription($ws, 'active');

        WorkspaceSubscriptionEvent::create([
            'workspace_id'    => $ws->id,
            'subscription_id' => $sub->id,
            'event_type'      => 'subscription_activated',
            'payload'         => [],
        ]);

        WorkspaceBillingInvoice::create([
            'workspace_id' => $ws->id, 'subscription_id' => $sub->id,
            'plan_id' => $this->plan->id, 'amount' => 49.90,
            'status' => 'paid', 'due_date' => now()->addDays(5),
            'reference_period' => '2026-04',
        ]);

        $timeline = $this->service->getWorkspaceTimeline($ws->id);

        $this->assertCount(2, $timeline);
        $sources = array_column($timeline, 'source');
        $this->assertContains('event', $sources);
        $this->assertContains('invoice', $sources);
    }

    /* ─── Trial Metrics ──────────────────────────────────────────────── */

    public function test_trials_expiring_soon_returns_within_7_days()
    {
        $ws1 = $this->makeWorkspace('t1');
        $ws2 = $this->makeWorkspace('t2');

        $this->makeSubscription($ws1, 'trialing', [
            'trial_ends_at' => now()->addDays(3),
            'starts_at'     => null,
        ]);
        $this->makeSubscription($ws2, 'trialing', [
            'trial_ends_at' => now()->addDays(30), // fora do range
            'starts_at'     => null,
        ]);

        $tm = $this->service->getTrialMetrics();
        $this->assertCount(1, $tm['expiring_soon']);
        $this->assertEquals($ws1->id, $tm['expiring_soon'][0]['workspace_id']);
    }

    /* ─── At Risk ────────────────────────────────────────────────────── */

    public function test_at_risk_includes_overdue_and_expiring_trials()
    {
        $ws1 = $this->makeWorkspace('r1');
        $ws2 = $this->makeWorkspace('r2');
        $ws3 = $this->makeWorkspace('r3');

        $this->makeSubscription($ws1, 'overdue');
        $this->makeSubscription($ws2, 'trialing', ['trial_ends_at' => now()->addDays(4), 'starts_at' => null]);
        $this->makeSubscription($ws3, 'active'); // não deve aparecer

        $atRisk = $this->service->getAtRiskWorkspaces();
        $ids    = array_column($atRisk, 'workspace_id');

        $this->assertContains($ws1->id, $ids);
        $this->assertContains($ws2->id, $ids);
        $this->assertNotContains($ws3->id, $ids);
    }
}
