<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\Professional;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(): Response
    {
        $holidays = Holiday::with('professional')->orderBy('date', 'desc')->paginate(15);
        $professionals = Professional::where('is_active', true)->get();
        
        return Inertia::render('Configurations/Holidays/Index', [
            'holidays' => $holidays,
            'professionals' => $professionals
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'professional_id' => 'nullable|exists:professionals,id',
            'repeats_yearly' => 'required|boolean',
        ]);

        Holiday::create($validated);

        return redirect()->route('configuracoes.holidays.index');
    }

    public function update(Request $request, Holiday $holiday): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'professional_id' => 'nullable|exists:professionals,id',
            'repeats_yearly' => 'required|boolean',
        ]);

        $holiday->update($validated);

        return redirect()->route('configuracoes.holidays.index');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $holiday->delete();
        return redirect()->route('configuracoes.holidays.index');
    }
}
