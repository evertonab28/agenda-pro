<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GeneralSettingsController extends Controller
{
    public function index(): Response
    {
        $settings = [
            'company_name' => Setting::get('company_name', 'Agenda Pro'),
            'slot_duration' => Setting::get('slot_duration', 30),
            'min_advance_minutes' => Setting::get('min_advance_minutes', 60),
            'max_window_days' => Setting::get('max_window_days', 30),
            'timezone' => Setting::get('timezone', 'America/Sao_Paulo'),
        ];

        return Inertia::render('Configurations/General/Index', ['settings' => $settings]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'slot_duration' => 'required|integer|min:5|max:120',
            'min_advance_minutes' => 'required|integer|min:0',
            'max_window_days' => 'required|integer|min:1',
            'timezone' => 'required|string',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        return redirect()->back()->with('success', 'Configurações salvas.');
    }
}
