<?php

namespace App\Http\Controllers;

use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PortalProfileController extends Controller
{
    public function show(Workspace $workspace)
    {
        $customer = Auth::guard('customer')->user();

        return Inertia::render('Portal/Profile', [
            'workspace' => $workspace,
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Workspace $workspace)
    {
        /** @var \App\Models\Customer $customer */
        $customer = Auth::guard('customer')->user();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'document' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
        ]);

        $customer->update($data);

        return redirect()->route('portal.profile', $workspace->slug)->with('success', 'Perfil atualizado com sucesso!');
    }
}
