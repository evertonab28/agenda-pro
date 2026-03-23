<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::where('is_active', true);

        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate(20);
    }

public function store(StoreCustomerRequest $request)
{
$customer = Customer::create($request->validated());
return response()->json($customer, 201);
}

public function show(Customer $customer)
{
return $customer;
}

public function update(StoreCustomerRequest $request, Customer $customer)
{
$customer->update($request->validated());
return $customer;
}

public function destroy(Customer $customer)
{
$customer->delete();
return response()->noContent();
}
}