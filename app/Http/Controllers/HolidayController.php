<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\Professional;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Holiday::class);
        $holidays = Holiday::with('professional')->orderBy('date', 'desc')->paginate(15);
        $professionals = Professional::where('is_active', true)->get();

        return Inertia::render('Configurations/Holidays/Index', [
            'holidays'      => $holidays,
            'professionals' => $professionals,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Holiday::class);
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'date'            => 'required|date',
            'professional_id' => 'nullable|exists:professionals,id',
            'repeats_yearly'  => 'required|boolean',
        ]);

        $holiday = Holiday::create($validated);
        AuditService::log(auth()->user(), 'holiday.created', $holiday);
        return redirect()->route('configuracoes.holidays.index');
    }

    public function update(Request $request, Holiday $holiday): RedirectResponse
    {
        $this->authorize('update', $holiday);
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'date'            => 'required|date',
            'professional_id' => 'nullable|exists:professionals,id',
            'repeats_yearly'  => 'required|boolean',
        ]);

        $holiday->update($validated);
        AuditService::log(auth()->user(), 'holiday.updated', $holiday);
        return redirect()->route('configuracoes.holidays.index');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $this->authorize('delete', $holiday);
        AuditService::log(auth()->user(), 'holiday.deleted', $holiday);
        $holiday->delete();
        return redirect()->route('configuracoes.holidays.index');
    }
}
