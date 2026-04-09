<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Satisfy CheckOnboarding middleware requirements.
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
    }
}