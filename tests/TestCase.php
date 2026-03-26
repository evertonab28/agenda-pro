<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Satisfy CheckOnboarding middleware requirements.
     */
    protected function fulfillOnboarding($clinicId): void
    {
        \App\Models\Setting::set('company_name', 'Test Clinic');

        $service = \App\Models\Service::factory()->create(['clinic_id' => $clinicId]);
        $prof = \App\Models\Professional::factory()->create(['clinic_id' => $clinicId]);
        
        \App\Models\ProfessionalSchedule::create([
            'clinic_id' => $clinicId,
            'professional_id' => $prof->id,
            'weekday' => 1,
            'start_time' => '08:00',
            'end_time' => '18:00',
            'is_active' => true
        ]);
    }
}
