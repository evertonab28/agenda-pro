<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Service::class);
        $services = Service::orderBy('name')->paginate(15);
        return Inertia::render('Configurations/Services/Index', ['services' => $services]);
    }

    public function create(): Response
    {
        $this->authorize('create', Service::class);
        return Inertia::render('Configurations/Services/Create');
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $this->authorize('create', Service::class);
        $service = Service::create($request->validated());

        AuditService::log(auth()->user(), 'service.created', $service);

        if (!Service::exists() || !\App\Models\Professional::exists() || !\App\Models\ProfessionalSchedule::exists()) {
            return redirect()->route('onboarding.index');
        }

        return redirect()->route('configuracoes.services.index');
    }

    public function show(Service $service): Response
    {
        $this->authorize('view', $service);
        return Inertia::render('Configurations/Services/Show', ['service' => $service]);
    }

    public function edit(Service $service): Response
    {
        $this->authorize('update', $service);
        return Inertia::render('Configurations/Services/Edit', ['service' => $service]);
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $this->authorize('update', $service);
        $service->update($request->validated());
        AuditService::log(auth()->user(), 'service.updated', $service);
        return redirect()->route('configuracoes.services.index');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $this->authorize('delete', $service);
        $service->update(['is_active' => false]);
        AuditService::log(auth()->user(), 'service.deactivated', $service);
        return redirect()->route('configuracoes.services.index');
    }
}
