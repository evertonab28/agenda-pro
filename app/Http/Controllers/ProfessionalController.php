<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\HasOnboarding;
use App\Http\Requests\StoreProfessionalRequest;
use App\Http\Requests\UpdateProfessionalRequest;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use App\Models\Service;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalController extends Controller
{
    use HasOnboarding;

    public function index(): Response
    {
        $this->authorize('viewAny', Professional::class);
        $professionals = Professional::with('services')->orderBy('name')->paginate(15);
        return Inertia::render('Configurations/Professionals/Index', ['professionals' => $professionals]);
    }

    public function create(): Response
    {
        $this->authorize('create', Professional::class);
        $services = Service::where('is_active', true)->get();
        return Inertia::render('Configurations/Professionals/Form', ['services' => $services]);
    }

    public function store(StoreProfessionalRequest $request): RedirectResponse
    {
        $this->authorize('create', Professional::class);

        $subscriptionService = app(\App\Services\Subscription\SubscriptionService::class);
        $currentCount = Professional::count();

        if (!$subscriptionService->canAddResource(auth()->user()->workspace, 'max_professionals', $currentCount)) {
            return redirect()->back()->with('error', 'Limite de profissionais atingido para seu plano atual. Faça um upgrade!');
        }

        $professional = Professional::create($request->validated());

        $professional->services()->sync($request->input('services', []));

        // Copy schedules from another professional in this workspace, or use
        // the hardcoded workspace defaults (Mon–Sat 09:00–18:00, break 12–13h).
        $this->seedDefaultSchedules($professional);

        AuditService::log(auth()->user(), 'professional.created', $professional);

        return $this->redirectOnboarding('configuracoes.professionals.index', 'Profissional criado com sucesso.');
    }

    public function edit(Professional $professional): Response
    {
        $this->authorize('update', $professional);
        $professional->load('services');
        $linkedIds = $professional->services->pluck('id');
        $services = Service::where('is_active', true)
            ->orWhereIn('id', $linkedIds)
            ->get();
        return Inertia::render('Configurations/Professionals/Form', [
            'professional' => $professional,
            'services'     => $services,
        ]);
    }

    public function update(UpdateProfessionalRequest $request, Professional $professional): RedirectResponse
    {
        $this->authorize('update', $professional);
        $professional->update($request->validated());

        $professional->services()->sync($request->input('services', []));

        AuditService::log(auth()->user(), 'professional.updated', $professional);

        return redirect()->route('configuracoes.professionals.index');
    }

    public function destroy(Professional $professional): RedirectResponse
    {
        $this->authorize('delete', $professional);
        $professional->update(['is_active' => false]);
        AuditService::log(auth()->user(), 'professional.deactivated', $professional);
        return redirect()->route('configuracoes.professionals.index');
    }

    /**
     * Seed default weekly schedules for a newly created professional.
     *
     * Strategy: copy from the first other professional that has schedules configured
     * (treats that as the workspace template). Falls back to Mon–Sat 09:00–18:00
     * with a 12:00–13:00 break if no reference professional exists yet.
     */
    private function seedDefaultSchedules(Professional $professional): void
    {
        $workspaceId = $professional->workspace_id;

        // Find a reference professional that already has schedules
        $reference = Professional::where('workspace_id', $workspaceId)
            ->where('id', '!=', $professional->id)
            ->whereHas('schedules', fn ($q) => $q->where('is_active', true))
            ->first();

        if ($reference) {
            $template = ProfessionalSchedule::where('professional_id', $reference->id)->get();

            foreach ($template as $row) {
                ProfessionalSchedule::create([
                    'workspace_id'    => $workspaceId,
                    'professional_id' => $professional->id,
                    'weekday'         => $row->weekday,
                    'start_time'      => $row->start_time,
                    'end_time'        => $row->end_time,
                    'break_start'     => $row->break_start,
                    'break_end'       => $row->break_end,
                    'is_active'       => $row->is_active,
                ]);
            }

            return;
        }

        // No reference — use hardcoded defaults: Mon(1)–Sat(6) open, Sun closed
        $defaults = [
            ['weekday' => 0, 'is_active' => false],
            ['weekday' => 1, 'is_active' => true],
            ['weekday' => 2, 'is_active' => true],
            ['weekday' => 3, 'is_active' => true],
            ['weekday' => 4, 'is_active' => true],
            ['weekday' => 5, 'is_active' => true],
            ['weekday' => 6, 'is_active' => true],
        ];

        foreach ($defaults as $day) {
            ProfessionalSchedule::create([
                'workspace_id'    => $workspaceId,
                'professional_id' => $professional->id,
                'weekday'         => $day['weekday'],
                'start_time'      => '09:00:00',
                'end_time'        => '18:00:00',
                'break_start'     => $day['is_active'] ? '12:00:00' : null,
                'break_end'       => $day['is_active'] ? '13:00:00' : null,
                'is_active'       => $day['is_active'],
            ]);
        }
    }
}
