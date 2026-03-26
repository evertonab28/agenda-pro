<?php

namespace App\Http\Controllers;

use App\Models\Clinic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PortalProfileController extends Controller
{
    public function show(Clinic $clinic)
    {
        $customer = Auth::guard('customer')->user();

        return Inertia::render('Portal/Profile', [
            'clinic' => $clinic,
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Clinic $clinic)
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

        return redirect()->route('portal.profile', $clinic->slug)->with('success', 'Perfil atualizado com sucesso!');
    }
}
