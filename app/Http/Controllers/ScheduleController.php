<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    /**
     * Display the schedule management page.
     */
    public function index(Request $request): Response
    {
        $professionals = Professional::where('is_active', true)->orderBy('name')->get();
        $selectedProfessionalId = $request->input('professional_id', $professionals->first()?->id);
        
        $schedules = [];
        if ($selectedProfessionalId) {
            $schedules = ProfessionalSchedule::where('professional_id', $selectedProfessionalId)
                ->orderBy('weekday')
                ->get();
        }

        return Inertia::render('Configurations/Schedules/Index', [
            'professionals' => $professionals,
            'selectedProfessionalId' => (int) $selectedProfessionalId,
            'schedules' => $schedules
        ]);
    }

    /**
     * Bulk update or create schedules for a professional.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'schedules' => 'required|array',
            'schedules.*.weekday' => 'required|integer|between:0,6',
            'schedules.*.start_time' => 'required|date_format:H:i',
            'schedules.*.end_time' => 'required|date_format:H:i|after:schedules.*.start_time',
            'schedules.*.break_start' => 'nullable|date_format:H:i',
            'schedules.*.break_end' => 'nullable|date_format:H:i|after:schedules.*.break_start',
            'schedules.*.is_active' => 'required|boolean',
        ]);

        foreach ($request->schedules as $sched) {
            ProfessionalSchedule::updateOrCreate(
                [
                    'professional_id' => $request->professional_id,
                    'weekday' => $sched['weekday'],
                ],
                [
                    'start_time' => $sched['start_time'],
                    'end_time' => $sched['end_time'],
                    'break_start' => $sched['break_start'] ?? null,
                    'break_end' => $sched['break_end'] ?? null,
                    'is_active' => $sched['is_active'],
                ]
            );
        }

        return redirect()->back()->with('success', 'Horários atualizados com sucesso.');
    }
}
