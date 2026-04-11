<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Creates the application.
     *
     * Overrides the default createApplication() so that when tests run via
     * a shared vendor (worktree pattern), the app is bootstrapped from
     * this worktree's bootstrap/app.php rather than the one inferred from
     * the Composer ClassLoader's registration path.
     */
    public function createApplication(): \Illuminate\Foundation\Application
    {
        $app = require __DIR__ . '/../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        return $app;
    }

    /**
     * Satisfy CheckOnboarding middleware requirements and ensure
     * the workspace has an active subscription so EnsureWorkspaceSubscription
     * does not gate test requests.
     */
    protected function fulfillOnboarding($workspaceId): void
    {
        \App\Models\Setting::setForWorkspace($workspaceId, 'company_name', 'Test Workspace');

        $service = \App\Models\Service::factory()->create(['workspace_id' => $workspaceId]);
        $prof = \App\Models\Professional::factory()->create(['workspace_id' => $workspaceId]);

        \App\Models\ProfessionalSchedule::create([
            'workspace_id' => $workspaceId,
            'professional_id' => $prof->id,
            'weekday' => 1,
            'start_time' => '08:00',
            'end_time' => '18:00',
            'is_active' => true
        ]);

        $this->ensureActiveSubscription($workspaceId);
    }

    /**
     * Create an active subscription for a workspace so the
     * EnsureWorkspaceSubscription middleware passes.
     */
    protected function ensureActiveSubscription($workspaceId): \App\Models\WorkspaceSubscription
    {
        $plan = \App\Models\Plan::firstOrCreate(
            ['slug' => 'test-plan'],
            [
                'name' => 'Plano Teste',
                'price' => 49.90,
                'billing_cycle' => 'monthly',
                'is_active' => true,
                'features' => [],
            ]
        );

        return \App\Models\WorkspaceSubscription::create([
            'workspace_id' => $workspaceId,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ]);
    }
}