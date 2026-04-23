<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\HasOnboarding;
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
}
