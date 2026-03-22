<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of the services.
     */
    public function index(): Response
    {
        $services = Service::orderBy('name')->paginate(15);
        return Inertia::render('Configurations/Services/Index', ['services' => $services]);
    }

    /**
     * Show the form for creating a new service.
     */
    public function create(): Response
    {
        return Inertia::render('Configurations/Services/Create');
    }

    /**
     * Store a newly created service in storage.
     */
    public function store(StoreServiceRequest $request): RedirectResponse
    {
        Service::create($request->validated());
        return redirect()->route('configuracoes.services.index');
    }

    /**
     * Display the specified service.
     */
    public function show(Service $service): Response
    {
        return Inertia::render('Configurations/Services/Show', ['service' => $service]);
    }

    /**
     * Show the form for editing the specified service.
     */
    public function edit(Service $service): Response
    {
        return Inertia::render('Configurations/Services/Edit', ['service' => $service]);
    }

    /**
     * Update the specified service in storage.
     */
    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $service->update($request->validated());
        return redirect()->route('configuracoes.services.index');
    }

    /**
     * Remove the specified service from storage.
     * Soft delete by setting is_active to false.
     */
    public function destroy(Service $service): RedirectResponse
    {
        $service->update(['is_active' => false]);
        return redirect()->route('configuracoes.services.index');
    }
}
