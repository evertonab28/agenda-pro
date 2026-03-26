<?php

namespace App\Http\Controllers\Traits;

use App\Models\Service;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Setting;

trait HasOnboarding
{
    /**
     * Check if the application onboarding is still in progress.
     */
    protected function onboardingInProgress(): bool
    {
        $hasSettings = Setting::where('key', 'company_name')->exists();
        $hasServices = Service::exists();
        $hasProfessionals = Professional::exists();
        $hasSchedules = ProfessionalSchedule::exists();

        return !$hasSettings || !$hasServices || !$hasProfessionals || !$hasSchedules;
    }

    /**
     * Redirect to the onboarding index if in progress, or fallback to a default route.
     */
    protected function redirectOnboarding(string $fallbackRoute, string $message = 'Salvo com sucesso.')
    {
        if ($this->onboardingInProgress()) {
            return redirect()->route('onboarding.index')->with('success', $message . ' Próximo passo!');
        }

        return redirect()->route($fallbackRoute)->with('success', $message);
    }
}
