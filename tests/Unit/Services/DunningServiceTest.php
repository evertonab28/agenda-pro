<?php

namespace Tests\Unit\Services;

use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscription;
use App\Models\WorkspaceSubscriptionEvent;
use App\Services\Retention\DunningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DunningServiceTest extends TestCase
{
    use RefreshDatabase;

    private DunningService $service;
    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DunningService();

        $this->plan = Plan::create([
            'name'          => 'Pro',
            'slug'          => 'pro',
            'price'         => 99.90,
            'billing_cycle' => 'monthly',
            'is_active'     => true,
            'features'      => [],
        ]);
    }

    private function makeWorkspace(string $suffix = ''): Workspace
    {
        return Workspace::create(['name' => "WS {$suffix}", 'slug' => "ws-{$suffix}"]);
    }

    private function makeSubscription(Workspace $ws, string $status): WorkspaceSubscription
    {
        return WorkspaceSubscription::create([
            'workspace_id' => $ws->id,
            'plan_id'      => $this->plan->id,
            'status'       => $status,
            'starts_at'    => now(),
        ]);
    }

    public function test_sends_upcoming_reminders_and_events_are_recorded_only_once()
    {
        $ws = $this->makeWorkspace('d1');
        $sub = $this->makeSubscription($ws, 'active');

        // Invoice that is pending and due in 3 days
        $invoice = WorkspaceBillingInvoice::create([
            'workspace_id' => $ws->id, 'subscription_id' => $sub->id,
            'plan_id' => $this->plan->id, 'amount' => 99.9,
            'status' => 'pending', 'due_date' => now()->addDays(3),
            'reference_period' => '2026-05',
        ]);

        $stats = $this->service->processReminders();
        
        $this->assertEquals(1, $stats['upcoming']);
        
        // Ensure event was created
        $this->assertDatabaseHas('workspace_subscription_events', [
            'event_type' => 'reminder_sent',
            'workspace_id' => $ws->id,
        ]);

        // Run again, should NOT send duplicate
        $stats2 = $this->service->processReminders();
        $this->assertEquals(0, $stats2['upcoming']);
        
        // Shouldn't double record events
        $this->assertEquals(1, WorkspaceSubscriptionEvent::count());
    }

    public function test_sends_due_today_reminders_and_overdue_reminders()
    {
        $ws2 = $this->makeWorkspace('d2');
        $sub2 = $this->makeSubscription($ws2, 'active');
        // Due today
        WorkspaceBillingInvoice::create([
            'workspace_id' => $ws2->id, 'subscription_id' => $sub2->id,
            'plan_id' => $this->plan->id, 'amount' => 99.9,
            'status' => 'pending', 'due_date' => now(), 'reference_period' => '2026-04',
        ]);

        $ws3 = $this->makeWorkspace('d3');
        $sub3 = $this->makeSubscription($ws3, 'overdue');
        // Overdue (due -4 days old)
        WorkspaceBillingInvoice::create([
            'workspace_id' => $ws3->id, 'subscription_id' => $sub3->id,
            'plan_id' => $this->plan->id, 'amount' => 99.9,
            'status' => 'overdue', 'due_date' => now()->subDays(4), 'reference_period' => '2026-03',
        ]);

        $stats = $this->service->processReminders();

        $this->assertEquals(1, $stats['due_today']);
        $this->assertEquals(1, $stats['overdue']);
        
        // 2 separate events
        $this->assertEquals(2, WorkspaceSubscriptionEvent::where('event_type', 'reminder_sent')->count());
    }
}
