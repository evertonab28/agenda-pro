<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppearanceController extends Controller
{
    public function index()
    {
        return \Inertia\Inertia::render('Configurations/Appearance/Index');
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'theme_preset' => 'sometimes|string|in:slate,ocean,emerald,violet,mono',
            'theme_mode' => 'sometimes|string|in:light,dark,system',
        ]);

        $user = Auth::user();

        if (isset($validated['theme_mode'])) {
            $user->update(['theme_mode' => $validated['theme_mode']]);
        }

        if (isset($validated['theme_preset']) && $user->role === 'admin') {
            $user->workspace->update(['theme_preset' => $validated['theme_preset']]);
        }

        return back()->with('success', 'Aparência atualizada!');
    }
}
