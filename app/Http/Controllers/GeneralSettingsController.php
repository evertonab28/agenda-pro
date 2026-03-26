<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\HasOnboarding;
use App\Models\Setting;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class GeneralSettingsController extends Controller
{
    use HasOnboarding;

    public function index(): Response
    {
        $this->authorize('manage-settings');

        $settings = [
            'company_name' => Setting::get('company_name', 'Agenda Pro'),
            'slot_duration' => Setting::get('slot_duration', 30),
            'min_advance_minutes' => Setting::get('min_advance_minutes', 60),
            'max_window_days' => Setting::get('max_window_days', 30),
            'currency' => Setting::get('currency', 'BRL'),
            'no_show_fee_enabled' => Setting::get('no_show_fee_enabled', false),
            'no_show_fee_amount' => Setting::get('no_show_fee_amount', 0),
            'default_buffer_minutes' => Setting::get('default_buffer_minutes', 0),
        ];

        return Inertia::render('Configurations/General/Index', ['settings' => $settings]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'slot_duration' => 'required|integer|min:5|max:120',
            'min_advance_minutes' => 'required|integer|min:0',
            'max_window_days' => 'required|integer|min:1',
            'currency' => 'required|string|size:3',
            'no_show_fee_enabled' => 'boolean',
            'no_show_fee_amount' => 'numeric|min:0',
            'default_buffer_minutes' => 'integer|min:0',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        AuditService::log(auth()->user(), 'settings.updated', null, $validated);

        if ($this->onboardingInProgress()) {
            return redirect()->route('onboarding.index')->with('success', 'Configurações salvas. Próximo passo!');
        }

        return redirect()->back()->with('success', 'Configurações salvas.');
    }
}
