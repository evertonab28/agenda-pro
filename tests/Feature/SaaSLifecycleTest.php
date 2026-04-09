<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscription;
use App\Services\Billing\AsaasSaasProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SaaSLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock Asaas Provider for all tests
        $this->mock(AsaasSaasProvider::class, function ($mock) {
            $mock->shouldReceive('getOrCreateCustomer')->andReturn('customer_id_123');
            $mock->shouldReceive('createPayment')->andReturn([
                'id' => 'pay_123',
                'invoiceUrl' => 'http://asaas.com/i/123'
            ]);
        });
    }

    public function test_recurring_billing_command_generates_invoice_for_expiring_subscription()
    {
        $plan = Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'price' => 100,
            'billing_cycle' => 'monthly',
            'is_active' => true,
            'features' => []
        ]);

        $workspace = Workspace::factory()->create();
        
        // Subscription expiring in 3 days
        $sub = WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now()->subDays(27),
            'ends_at' => now()->addDays(3),
        ]);

        $this->artisan('saas:billing-recurring')
            ->expectsOutput("Encontradas 1 assinaturas para análise de renovação.")
            ->expectsOutput("Gerando fatura de renovação para o workspace: {$workspace->name} (Período: " . now()->addDays(4)->format('m/Y') . ")")
            ->assertExitCode(0);

        $this->assertDatabaseHas('workspace_billing_invoices', [
            'workspace_id' => $workspace->id,
            'reference_period' => now()->addDays(4)->format('m/Y'),
            'status' => 'pending'
        ]);
        
        // Assert event was logged
        $this->assertDatabaseHas('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type' => 'invoice_generated'
        ]);
    }

    public function test_billing_dunning_command_marks_expired_subscription_as_overdue()
    {
        $plan = Plan::create(['name' => 'Pro', 'slug' => 'pro', 'price' => 100, 'billing_cycle' => 'monthly', 'is_active' => true, 'features' => []]);
        $workspace = Workspace::factory()->create();
        
        // Expired subscription
        $sub = WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->subMinute(),
        ]);

        $this->artisan('saas:billing-dunning')
            ->expectsOutput("Assinaturas ativas vencidas: 1")
            ->assertExitCode(0);

        $this->assertEquals('overdue', $sub->fresh()->status);
        $this->assertFalse($sub->fresh()->isActive());

        // Assert event was logged
        $this->assertDatabaseHas('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type' => 'overdue'
        ]);
    }

    public function test_confirm_payment_reactivates_overdue_subscription()
    {
        $plan = Plan::create(['name' => 'Pro', 'slug' => 'pro', 'price' => 100, 'billing_cycle' => 'monthly', 'is_active' => true, 'features' => []]);
        $workspace = Workspace::factory()->create();
        
        $sub = WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'plan_id' => $plan->id,
            'status' => 'overdue',
            'starts_at' => now()->subMonth(),
            'ends_at' => now()->subDay(),
        ]);

        $invoice = WorkspaceBillingInvoice::create([
            'workspace_id' => $workspace->id,
            'subscription_id' => $sub->id,
            'plan_id' => $plan->id,
            'amount' => 100,
            'status' => 'pending',
            'due_date' => now()->addDays(3),
            'reference_period' => '05/2026'
        ]);

        $billingService = app(\App\Services\Billing\WorkspaceBillingService::class);
        $billingService->confirmPayment($invoice);

        $this->assertEquals('active', $sub->fresh()->status);
        $this->assertTrue($sub->fresh()->isActive());
        $this->assertEquals(now()->addMonth()->format('Y-m-d'), $sub->fresh()->ends_at->format('Y-m-d'));

        // Assert reactivated event
        $this->assertDatabaseHas('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type' => 'subscription_reactivated'
        ]);
    }

    public function test_cancel_subscription_via_controller()
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();
        $user->workspace()->associate($workspace);
        $user->save();

        // Admin role for authorize
        $user->update(['role' => 'admin']);

        $plan = Plan::create(['name' => 'Pro', 'slug' => 'pro', 'price' => 100, 'billing_cycle' => 'monthly', 'is_active' => true, 'features' => []]);
        $sub = WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        $response = $this->actingAs($user)
            ->post(route('configuracoes.billing.cancel'));

        $response->assertRedirect();
        $this->assertEquals('canceled', $sub->fresh()->status);
        $this->assertNotNull($sub->fresh()->canceled_at);
        
        // Should STILL be active because ends_at is in future
        $this->assertTrue($sub->fresh()->isActive());

        $this->assertDatabaseHas('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type' => 'canceled'
        ]);
    }

    public function test_activate_route_generates_trial_conversion_invoice()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $workspace = Workspace::factory()->create();
        $user->workspace()->associate($workspace);
        $user->save();

        $plan = Plan::create([
            'name' => 'Starter', 'slug' => 'starter',
            'price' => 49.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);

        WorkspaceSubscription::create([
            'workspace_id'  => $workspace->id,
            'plan_id'       => $plan->id,
            'status'        => 'trialing',
            'trial_ends_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($user)
            ->post(route('configuracoes.billing.activate'), ['plan_id' => $plan->id]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('workspace_billing_invoices', [
            'workspace_id' => $workspace->id,
            'plan_id'      => $plan->id,
            'status'       => 'pending',
        ]);

        $this->assertDatabaseHas('workspace_subscription_events', [
            'workspace_id' => $workspace->id,
            'event_type'   => 'invoice_generated',
        ]);
    }

    public function test_upgrade_route_rejects_same_plan_when_trialing()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $workspace = Workspace::factory()->create();
        $user->workspace()->associate($workspace);
        $user->save();

        $plan = Plan::create([
            'name' => 'Starter', 'slug' => 'starter',
            'price' => 49.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);

        WorkspaceSubscription::create([
            'workspace_id'  => $workspace->id,
            'plan_id'       => $plan->id,
            'status'        => 'trialing',
            'trial_ends_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($user)
            ->post(route('configuracoes.billing.upgrade'), ['plan_id' => $plan->id]);

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $this->assertDatabaseMissing('workspace_billing_invoices', [
            'workspace_id' => $workspace->id,
        ]);
    }

    public function test_trial_to_higher_plan_uses_upgrade_route()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $workspace = Workspace::factory()->create();
        $user->workspace()->associate($workspace);
        $user->save();

        $starter = Plan::create([
            'name' => 'Starter', 'slug' => 'starter',
            'price' => 49.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);
        $pro = Plan::create([
            'name' => 'Pro', 'slug' => 'pro',
            'price' => 99.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);

        WorkspaceSubscription::create([
            'workspace_id'  => $workspace->id,
            'plan_id'       => $starter->id,
            'status'        => 'trialing',
            'trial_ends_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($user)
            ->post(route('configuracoes.billing.upgrade'), ['plan_id' => $pro->id]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('workspace_billing_invoices', [
            'workspace_id' => $workspace->id,
            'plan_id'      => $pro->id,
            'status'       => 'pending',
        ]);
    }

    public function test_confirm_payment_for_trial_conversion_emits_subscription_activated()
    {
        $plan = Plan::create([
            'name' => 'Starter', 'slug' => 'starter',
            'price' => 49.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);

        $workspace = Workspace::factory()->create();

        $sub = WorkspaceSubscription::create([
            'workspace_id'  => $workspace->id,
            'plan_id'       => $plan->id,
            'status'        => 'trialing',
            'trial_ends_at' => now()->addDays(5),
        ]);

        $invoice = WorkspaceBillingInvoice::create([
            'workspace_id'    => $workspace->id,
            'subscription_id' => $sub->id,
            'plan_id'         => $plan->id,
            'amount'          => 49.90,
            'status'          => 'pending',
            'due_date'        => now()->addDays(3),
            'reference_period' => now()->format('m/Y'),
            'meta'            => ['type' => 'trial_conversion'],
        ]);

        $billingService = app(\App\Services\Billing\WorkspaceBillingService::class);
        $billingService->confirmPayment($invoice);

        $this->assertEquals('active', $sub->fresh()->status);
        $this->assertTrue($sub->fresh()->isActive());
        $this->assertNull($sub->fresh()->trial_ends_at);

        $this->assertDatabaseHas('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type'      => 'subscription_activated',
        ]);

        $this->assertDatabaseMissing('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type'      => 'subscription_renewed',
        ]);
    }

    public function test_confirm_payment_for_trial_upgrade_emits_subscription_activated_and_plan_upgraded()
    {
        $starter = Plan::create([
            'name' => 'Starter', 'slug' => 'starter',
            'price' => 49.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);
        $pro = Plan::create([
            'name' => 'Pro', 'slug' => 'pro',
            'price' => 99.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);

        $workspace = Workspace::factory()->create();

        $sub = WorkspaceSubscription::create([
            'workspace_id'  => $workspace->id,
            'plan_id'       => $starter->id,
            'status'        => 'trialing',
            'trial_ends_at' => now()->addDays(5),
        ]);

        // Invoice is for the Pro plan (upgrade during trial)
        $invoice = WorkspaceBillingInvoice::create([
            'workspace_id'    => $workspace->id,
            'subscription_id' => $sub->id,
            'plan_id'         => $pro->id,
            'amount'          => 99.90,
            'status'          => 'pending',
            'due_date'        => now()->addDays(3),
            'reference_period' => now()->format('m/Y'),
            'meta'            => ['type' => 'upgrade'],
        ]);

        $billingService = app(\App\Services\Billing\WorkspaceBillingService::class);
        $billingService->confirmPayment($invoice);

        $this->assertEquals('active', $sub->fresh()->status);
        $this->assertEquals($pro->id, $sub->fresh()->plan_id);
        $this->assertNull($sub->fresh()->trial_ends_at);

        // Must emit subscription_activated
        $this->assertDatabaseHas('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type'      => 'subscription_activated',
        ]);

        // Must ALSO emit plan_upgraded to capture MRR movement
        $this->assertDatabaseHas('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type'      => 'plan_upgraded',
        ]);

        $this->assertDatabaseMissing('workspace_subscription_events', [
            'subscription_id' => $sub->id,
            'event_type'      => 'subscription_renewed',
        ]);
    }

    public function test_activate_route_rejects_non_trialing_workspace()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $workspace = Workspace::factory()->create();
        $user->workspace()->associate($workspace);
        $user->save();

        $plan = Plan::create([
            'name' => 'Starter', 'slug' => 'starter',
            'price' => 49.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);

        WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'plan_id'      => $plan->id,
            'status'       => 'active',
            'starts_at'    => now(),
            'ends_at'      => now()->addMonth(),
        ]);

        $response = $this->actingAs($user)
            ->post(route('configuracoes.billing.activate'), ['plan_id' => $plan->id]);

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $this->assertDatabaseMissing('workspace_billing_invoices', [
            'workspace_id' => $workspace->id,
        ]);
    }

    public function test_upgrade_route_allows_active_same_plan_as_renewal()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $workspace = Workspace::factory()->create();
        $user->workspace()->associate($workspace);
        $user->save();

        $plan = Plan::create([
            'name' => 'Starter', 'slug' => 'starter',
            'price' => 49.90, 'billing_cycle' => 'monthly',
            'is_active' => true, 'features' => [],
        ]);

        WorkspaceSubscription::create([
            'workspace_id' => $workspace->id,
            'plan_id'      => $plan->id,
            'status'       => 'active',
            'starts_at'    => now(),
            'ends_at'      => now()->addMonth(),
        ]);

        $response = $this->actingAs($user)
            ->post(route('configuracoes.billing.upgrade'), ['plan_id' => $plan->id]);

        // upgrade for active + same plan is allowed (no 500, no uncontrolled error)
        $response->assertRedirect();
        $response->assertSessionMissing('exception');
    }
}
