<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Models\Receipt;
use App\Services\AuditService;
use App\Enums\ChargeStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

use App\Services\FinanceService;

class ChargeController extends Controller
{
    private $financeService;

    public function __construct(FinanceService $financeService)
    {
        $this->financeService = $financeService;
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Charge::class);

        $query = Charge::with('customer')
            ->withSum('receipts', 'amount_received');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($c) use ($search) {
                      $c->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where(function($q) use ($request) {
                $q->where('status', $request->input('status'));
            });
        }

        if ($request->filled('payment_method') && $request->input('payment_method') !== 'all') {
            $query->where(function ($q) use ($request) {
                $q->where('payment_method', $request->input('payment_method'));
            });
        }

        if ($request->filled('due_date_start')) {
            $query->where(function ($q) use ($request) {
                $q->where('due_date', '>=', $request->input('due_date_start'));
            });
        }
        
        if ($request->filled('due_date_end')) {
            $query->where(function ($q) use ($request) {
                $q->where('due_date', '<=', $request->input('due_date_end'));
            });
        }

        // Sort: overdue first, then by due_date asc
        $query->orderByRaw("CASE WHEN status = 'overdue' THEN 1 ELSE 2 END")
              ->orderBy('due_date', 'asc')
              ->orderBy('id', 'desc');

        $charges = $query->paginate(15)->withQueryString();

        return Inertia::render('Finance/Charges/Index', [
            'charges' => $charges,
            'filters' => $request->all(),
        ]);
    }

    public function create()
    {
        $this->authorize('create', Charge::class);
        return Inertia::render('Finance/Charges/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create', Charge::class);

        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'due_date' => 'required|date',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = ChargeStatus::Pending->value;
        $validated['due_date'] = Carbon::createFromFormat('Y-m-d', $validated['due_date']);
        $validated['clinic_id'] = auth()->user()->clinic_id;

        $charge = Charge::create($validated);
        AuditService::log(auth()->user(), 'charge.created', $charge);

        return redirect()->route('finance.charges.index')->with('success', 'Cobrança criada com sucesso.');
    }

    public function show(Charge $charge)
    {
        $this->authorize('view', $charge);

        $charge->load(['customer', 'receipts' => function($q) {
            $q->orderBy('received_at', 'desc');
        }]);
        $charge->loadSum('receipts', 'amount_received');

        return Inertia::render('Finance/Charges/Show', [
            'charge' => $charge,
        ]);
    }

    public function edit(Charge $charge)
    {
        $this->authorize('update', $charge);
        return Inertia::render('Finance/Charges/Edit', [
            'charge' => $charge,
        ]);
    }

    public function update(Request $request, Charge $charge)
    {
        $this->authorize('update', $charge);

        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'due_date' => 'required|date',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['due_date'] = Carbon::createFromFormat('Y-m-d', $validated['due_date']);
        $validated['clinic_id'] = auth()->user()->clinic_id;
        
        $charge->update($validated);
        AuditService::log(auth()->user(), 'charge.updated', $charge);

        return redirect()->route('finance.charges.index')->with('success', 'Cobrança atualizada com sucesso.');
    }

    public function destroy(Charge $charge)
    {
        $this->authorize('delete', $charge);

        $charge->update(['status' => ChargeStatus::Canceled->value]);
        AuditService::log(auth()->user(), 'charge.canceled', $charge);

        return back()->with('success', 'Cobrança cancelada.');
    }

    public function receive(Request $request, Charge $charge)
    {
        $this->authorize('receive', $charge);

        $charge->loadSum('receipts', 'amount_received');
        $openBalance = max(0, $charge->amount - ($charge->receipts_sum_amount_received ?? 0));

        if ($openBalance <= 0) {
            return back()->with('error', 'Esta cobrança já está totalmente quitada.');
        }

        $validated = $request->validate([
            'amount_received' => "required|numeric|min:0.01|max:{$openBalance}",
            'received_at' => 'required|date',
            'method' => 'required|string',
            'fee_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        try {
            $this->financeService->receivePayment($charge, $validated, auth()->user());
            return back()->with('success', 'Recebimento registrado com sucesso.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao registrar recebimento.');
        }
    }
}
