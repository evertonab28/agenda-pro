<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProfessionalRequest;
use App\Http\Requests\UpdateProfessionalRequest;
use App\Models\Professional;
use App\Models\Service;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalController extends Controller
{
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
        $professional = Professional::create($request->validated());

        if ($request->has('services')) {
            $professional->services()->sync($request->services);
        }

        AuditService::log(auth()->user(), 'professional.created', $professional);

        if (!Service::exists() || !Professional::exists() || !\App\Models\ProfessionalSchedule::exists()) {
            return redirect()->route('onboarding.index');
        }

        return redirect()->route('configuracoes.professionals.index');
    }

    public function edit(Professional $professional): Response
    {
        $this->authorize('update', $professional);
        $professional->load('services');
        $services = Service::where('is_active', true)->get();
        return Inertia::render('Configurations/Professionals/Form', [
            'professional' => $professional,
            'services'     => $services,
        ]);
    }

    public function update(UpdateProfessionalRequest $request, Professional $professional): RedirectResponse
    {
        $this->authorize('update', $professional);
        $professional->update($request->validated());

        if ($request->has('services')) {
            $professional->services()->sync($request->services);
        }

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
}
