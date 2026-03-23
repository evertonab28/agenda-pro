<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Service;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;

class OnboardingController extends Controller
{
    public function index()
    {
        $hasServices = Service::exists();
        $hasProfessionals = Professional::exists();
        $hasSchedules = ProfessionalSchedule::exists();

        // Calculate current step
        $step = 1;
        if ($hasServices) $step = 2;
        if ($hasServices && $hasProfessionals) $step = 3;
        if ($hasServices && $hasProfessionals && $hasSchedules) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding/Index', [
            'step' => $step,
            'hasServices' => $hasServices,
            'hasProfessionals' => $hasProfessionals,
            'hasSchedules' => $hasSchedules,
        ]);
    }
}
