<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Service;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Setting;

class OnboardingController extends Controller
{
    public function index()
    {
        $hasSettings = Setting::where('key', 'company_name')->exists();
        $hasServices = Service::exists();
        $hasProfessionals = Professional::exists();
        $hasSchedules = ProfessionalSchedule::exists();

        // Calculate current step (1 to 4)
        $step = 1;
        if ($hasSettings) $step = 2;
        if ($hasSettings && $hasServices) $step = 3;
        if ($hasSettings && $hasServices && $hasProfessionals) $step = 4;
        
        if ($hasSettings && $hasServices && $hasProfessionals && $hasSchedules) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding/Index', [
            'step' => $step,
            'hasSettings' => $hasSettings,
            'hasServices' => $hasServices,
            'hasProfessionals' => $hasProfessionals,
            'hasSchedules' => $hasSchedules,
        ]);
    }
}
