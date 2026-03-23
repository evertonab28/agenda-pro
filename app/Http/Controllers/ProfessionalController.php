<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProfessionalRequest;
use App\Http\Requests\UpdateProfessionalRequest;
use App\Models\Professional;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProfessionalController extends Controller
{
    /**
     * Display a listing of the professionals.
     */
    public function index(): Response
    {
        $professionals = Professional::with('services')->orderBy('name')->paginate(15);
        return Inertia::render('Configurations/Professionals/Index', ['professionals' => $professionals]);
    }

    /**
     * Show the form for creating a new professional.
     */
    public function create(): Response
    {
        $services = Service::where('is_active', true)->get();
        return Inertia::render('Configurations/Professionals/Form', ['services' => $services]);
    }

    /**
     * Store a newly created professional in storage.
     */
    public function store(StoreProfessionalRequest $request): RedirectResponse
    {
        $professional = Professional::create($request->validated());
        
        if ($request->has('services')) {
            $professional->services()->sync($request->services);
        }
        
        if (!Service::exists() || !Professional::exists() || !\App\Models\ProfessionalSchedule::exists()) {
            return redirect()->route('onboarding.index');
        }

        return redirect()->route('configuracoes.professionals.index');
    }

    /**
     * Show the form for editing the specified professional.
     */
    public function edit(Professional $professional): Response
    {
        $professional->load('services');
        $services = Service::where('is_active', true)->get();
        return Inertia::render('Configurations/Professionals/Form', [
            'professional' => $professional,
            'services' => $services
        ]);
    }

    /**
     * Update the specified professional in storage.
     */
    public function update(UpdateProfessionalRequest $request, Professional $professional): RedirectResponse
    {
        $professional->update($request->validated());
        
        if ($request->has('services')) {
            $professional->services()->sync($request->services);
        }
        
        return redirect()->route('configuracoes.professionals.index');
    }

    /**
     * Remove the specified professional from storage.
     * Soft delete by setting is_active to false.
     */
    public function destroy(Professional $professional): RedirectResponse
    {
        $professional->update(['is_active' => false]);
        return redirect()->route('configuracoes.professionals.index');
    }
}
