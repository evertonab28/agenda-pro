<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Services\AuditService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Services\CRMService;

class CustomerController extends Controller
{
    private $crmService;

    public function __construct(CRMService $crmService)
    {
        $this->crmService = $crmService;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Customer::class);
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

        $stats = $this->crmService->getCustomerStats();

        return Inertia::render('Customers/Index', [
            'customers' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'status', 'pending_finance']),
            'stats' => $stats
        ]);
    }

    public function create()
    {
        $this->authorize('create', Customer::class);
        return Inertia::render('Customers/Create');
    }

    public function store(StoreCustomerRequest $request)
    {
        $this->authorize('create', Customer::class);
        $customer = Customer::create($request->validated());
        AuditService::log(auth()->user(), 'customer.created', $customer);
        return redirect()->route('customers.index')->with('success', 'Cliente criado com sucesso!');
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);
        $customer->loadCount('appointments');
        
        $summary = $this->crmService->getCustomerSummary($customer);

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

        $customer->load(['wallet', 'customerPackages.package']);

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'summary' => $summary,
            'appointments' => $appointments,
            'financial_history' => $charges,
            'wallet_transactions' => $customer->wallet ? $customer->wallet->transactions()->latest()->take(10)->get() : [],
            'packages' => $customer->customerPackages()->with('package')->get(),
        ]);
    }

    /**
     * Add manual credit to customer wallet.
     */
    public function addCredit(Request $request, Customer $customer, \App\Services\WalletService $walletService)
    {
        $this->authorize('addCredit', $customer);
        $this->authorize('update', $customer);

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
        ]);

        $walletService->credit($customer, $request->amount, $request->description);

        return back()->with('success', 'Crédito adicionado com sucesso!');
    }

    public function edit(Customer $customer)
    {
        $this->authorize('update', $customer);
        return Inertia::render('Customers/Edit', [
            'customer' => $customer
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $this->authorize('update', $customer);
        $customer->update($request->validated());
        AuditService::log(auth()->user(), 'customer.updated', $customer);
        return redirect()->route('customers.show', $customer)->with('success', 'Cliente atualizado com sucesso!');
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);
        if ($customer->appointments()->exists()) {
            return back()->with('error', 'Não é possível excluir cliente com agendamentos vinculados. Inative-o em vez disso.');
        }

        AuditService::log(auth()->user(), 'customer.deleted', $customer);
        $customer->delete();
        return redirect()->route('customers.index')->with('success', 'Cliente excluído com sucesso!');
    }

    public function toggleStatus(Customer $customer)
    {
        $this->authorize('update', $customer);
        $customer->update(['is_active' => !$customer->is_active]);
        AuditService::log(auth()->user(), 'customer.status_toggled', $customer);
        return back()->with('success', 'Status do cliente atualizado!');
    }
}
