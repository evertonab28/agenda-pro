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

        $workspace = auth()->user()->workspace;

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

        return Inertia::render('Configurations/General/Index', [
            'settings' => $settings,
            'workspace' => $workspace
        ]);
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

            // Public Profile fields
            'public_name' => 'nullable|string|max:255',
            'public_description' => 'nullable|string',
            'whatsapp_number' => 'nullable|string|max:20',
            'instagram_handle' => 'nullable|string|max:100',
            'address_street' => 'nullable|string|max:255',
            'address_number' => 'nullable|string|max:20',
            'address_complement' => 'nullable|string|max:255',
            'address_district' => 'nullable|string|max:255',
            'address_city' => 'nullable|string|max:255',
            'address_state' => 'nullable|string|size:2',
            'address_zip' => 'nullable|string|max:10',
            'show_location' => 'boolean',
            'show_contact_button' => 'boolean',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
        ]);

        // Split data between Setting and Workspace
        $settingKeys = [
            'company_name', 'slot_duration', 'min_advance_minutes', 
            'max_window_days', 'currency', 'no_show_fee_enabled', 
            'no_show_fee_amount', 'default_buffer_minutes'
        ];

        foreach ($settingKeys as $key) {
            if (isset($validated[$key])) {
                Setting::set($key, $validated[$key]);
            }
        }

        // Update Workspace
        $workspaceFields = collect($validated)->except($settingKeys)->toArray();
        auth()->user()->workspace->update($workspaceFields);

        AuditService::log(auth()->user(), 'settings.updated', null, $validated);

        if ($this->onboardingInProgress()) {
            return redirect()->route('onboarding.index')->with('success', 'Configurações salvas. Próximo passo!');
        }

        return redirect()->back()->with('success', 'Configurações salvas.');
    }
}
