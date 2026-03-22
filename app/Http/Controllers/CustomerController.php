<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query()
            ->withCount(['appointments' => function ($query) {
                $query->where('status', '!=', 'canceled');
            }])
            ->with(['appointments' => function ($query) {
                $query->latest('starts_at')->limit(1);
            }]);

        // Search filter
        $query->when(fn() => $request->filled('search'), function ($q) use ($request) {
            $search = $request->input('search');
            $q->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('document', 'like', "%{$search}%");
            });
        });

        // Status filter
        $query->when(fn() => $request->filled('status') && $request->input('status') !== 'all', function ($q) use ($request) {
            $q->where('is_active', $request->input('status') === 'active');
        });

        // Financial Pending filter
        $query->when($request->has('pending_finance') && $request->pending_finance !== 'all', function ($q) use ($request) {
            if ($request->pending_finance === 'yes') {
                $q->whereHas('appointments.charge', function ($q2) {
                    $q2->whereNull('paid_at');
                });
            } else {
                $q->whereDoesntHave('appointments.charge', function ($q2) {
                    $q2->whereNull('paid_at');
                });
            }
        });

        return Inertia::render('Customers/Index', [
            'customers' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'status', 'pending_finance']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Customers/Create');
    }

    public function store(StoreCustomerRequest $request)
    {
        Customer::create($request->validated());
        return redirect()->route('customers.index')->with('success', 'Cliente criado com sucesso!');
    }

    public function show(Customer $customer)
    {
        $customer->loadCount('appointments');
        
        // Detailed summary data
        $summary = [
            'total_paid' => $customer->charges()->whereNotNull('paid_at')->sum('amount'),
            'total_pending' => $customer->charges()->whereNull('paid_at')->where('due_date', '>=', now()->toDateString())->sum('amount'),
            'total_overdue' => $customer->charges()->whereNull('paid_at')->where('due_date', '<', now()->toDateString())->sum('amount'),
        ];

        $appointments = $customer->appointments()
            ->with(['service', 'professional'])
            ->where(function ($q) {
                $q->where('appointments.status', '!=', 'canceled');
            })
            ->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate(10, ['*'], 'appointments_page');

        $charges = $customer->charges()
            ->withSum('receipts', 'amount_received')
            ->where(function ($q) {
                $q->where('charges.status', '!=', 'canceled');
            })
            ->orderBy('due_date', 'desc')
            ->paginate(10, ['*'], 'charges_page');

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'summary' => $summary,
            'appointments' => $appointments,
            'financial_history' => $charges,
        ]);
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $customer->update($request->validated());
        return redirect()->route('customers.show', $customer)->with('success', 'Cliente atualizado com sucesso!');
    }

    public function destroy(Customer $customer)
    {
        if ($customer->appointments()->exists()) {
            return back()->with('error', 'Não é possível excluir cliente com agendamentos vinculados. Inative-o em vez disso.');
        }

        $customer->delete();
        return redirect()->route('customers.index')->with('success', 'Cliente excluído com sucesso!');
    }

    public function toggleStatus(Customer $customer)
    {
        $customer->update(['is_active' => !$customer->is_active]);
        return back()->with('success', 'Status do cliente atualizado!');
    }
}
