<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Service;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Setting;
use App\Services\AgendaService;
use Carbon\Carbon;

class OnboardingController extends Controller
{
    private const SLOT_LOOKAHEAD_DAYS = 14;

    public function __construct(private AgendaService $agendaService)
    {
    }

    public function index()
    {
        $hasSettings = Setting::where('key', 'company_name')->exists();
        $hasServices = Service::where('is_active', true)->exists();
        $hasProfessionals = Professional::where('is_active', true)->exists();
        $hasServiceProfessionalLink = Service::where('is_active', true)
            ->whereHas('professionals', fn ($query) => $query->where('is_active', true))
            ->exists();
        $hasSchedules = ProfessionalSchedule::where('is_active', true)->exists();
        $availableSlot = $this->findFirstPublicSlot();
        $hasAvailableSlot = $availableSlot !== null;
        $workspace = auth()->user()->workspace;
        $publicBookingPath = "/p/{$workspace->slug}";
        $officialAppUrl = 'https://app.agendanexo.com.br';

        // Calculate current step (1 to 4)
        $step = 1;
        if ($hasSettings) $step = 2;
        if ($hasSettings && $hasServices) $step = 3;
        if ($hasSettings && $hasServices && $hasProfessionals && $hasServiceProfessionalLink) $step = 4;
        
        $isActivationReady = $hasSettings
            && $hasServices
            && $hasProfessionals
            && $hasServiceProfessionalLink
            && $hasSchedules
            && $hasAvailableSlot;

        return Inertia::render('Onboarding/Index', [
            'step' => $step,
            'hasSettings' => $hasSettings,
            'hasServices' => $hasServices,
            'hasProfessionals' => $hasProfessionals,
            'hasServiceProfessionalLink' => $hasServiceProfessionalLink,
            'hasSchedules' => $hasSchedules,
            'hasAvailableSlot' => $hasAvailableSlot,
            'isActivationReady' => $isActivationReady,
            'publicBookingPath' => $publicBookingPath,
            'publicBookingUrl' => "{$officialAppUrl}{$publicBookingPath}",
            'portalCurrentPath' => "/p/{$workspace->slug}/login",
            'portalOfficialPath' => "/portal/{$workspace->slug}",
            'activationWindowDays' => self::SLOT_LOOKAHEAD_DAYS,
            'firstAvailableSlot' => $availableSlot,
        ]);
    }

    private function findFirstPublicSlot(): ?array
    {
        $services = Service::where('is_active', true)
            ->whereHas('professionals', fn ($query) => $query->where('is_active', true))
            ->with(['professionals' => fn ($query) => $query->where('is_active', true)])
            ->get();

        if ($services->isEmpty()) {
            return null;
        }

        $today = now()->startOfDay();

        foreach (range(0, self::SLOT_LOOKAHEAD_DAYS - 1) as $dayOffset) {
            $date = $today->copy()->addDays($dayOffset);
            $weekday = $date->dayOfWeek;

            foreach ($services as $service) {
                foreach ($service->professionals as $professional) {
                    $schedule = ProfessionalSchedule::where('professional_id', $professional->id)
                        ->where('weekday', $weekday)
                        ->where('is_active', true)
                        ->first();

                    if (!$schedule) {
                        continue;
                    }

                    $duration = $service->duration_minutes + ($service->buffer_minutes ?? 0);
                    $startTime = Carbon::parse($date->toDateString() . ' ' . $schedule->start_time);
                    $endTime = Carbon::parse($date->toDateString() . ' ' . $schedule->end_time);

                    for ($slotStart = $startTime->copy(); $slotStart->copy()->addMinutes($duration)->lte($endTime); $slotStart->addMinutes(30)) {
                        if ($slotStart->lte(now())) {
                            continue;
                        }

                        $slotEnd = $slotStart->copy()->addMinutes($duration);
                        $availability = $this->agendaService->isAvailable(
                            $professional->id,
                            $slotStart->toDateTimeString(),
                            $slotEnd->toDateTimeString(),
                            null,
                            $service->id
                        );

                        if ($availability['available']) {
                            return [
                                'date' => $slotStart->toDateString(),
                                'time' => $slotStart->format('H:i'),
                                'service' => $service->name,
                                'professional' => $professional->name,
                            ];
                        }
                    }
                }
            }
        }

        return null;
    }
}
