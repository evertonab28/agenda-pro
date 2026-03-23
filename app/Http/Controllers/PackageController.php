<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Service;
use App\Models\Customer;
use App\Services\PackageService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PackageController extends Controller
{
    // Removing constructor that used authorizeResource as it causes issues in Laravel 11 with the base Controller

    public function index()
    {
        $this->authorize('viewAny', Package::class);
        return Inertia::render('Packages/Index', [
            'packages' => Package::with('service')->get(),
            'services' => Service::where('is_active', true)->get(['id', 'name']),
            'customers' => \App\Models\Customer::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Package::class);
        $data = $request->validate([
            'service_id' => 'required|exists:services,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sessions_count' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'validity_days' => 'required|integer|min:0',
        ]);

        Package::create($data);

        return redirect()->back()->with('success', 'Pacote criado com sucesso.');
    }

    public function update(Request $request, Package $package)
    {
        $this->authorize('update', $package);
        $data = $request->validate([
            'service_id' => 'required|exists:services,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sessions_count' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'validity_days' => 'required|integer|min:1',
            'is_active' => 'required|boolean',
        ]);

        $package->update($data);

        return redirect()->back()->with('success', 'Pacote atualizado.');
    }

    /**
     * Sell a package to a specific customer.
     */
    public function sell(Request $request, Package $package, PackageService $packageService)
    {
        $this->authorize('sell', Package::class);
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
        ]);

        $customer = Customer::findOrFail($request->customer_id);
        
        try {
            $packageService->sellPackage($customer, $package);
            return redirect()->back()->with('success', "Pacote {$package->name} vendido para {$customer->name}!");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
