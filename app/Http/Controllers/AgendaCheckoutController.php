<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Charge;
use App\Services\CheckoutService;
use App\Enums\AppointmentStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgendaCheckoutController extends Controller
{
    protected $checkoutService;
    protected $walletService;
    protected $packageService;

    public function __construct(CheckoutService $checkoutService, \App\Services\WalletService $walletService, \App\Services\PackageService $packageService)
    {
        $this->checkoutService = $checkoutService;
        $this->walletService = $walletService;
        $this->packageService = $packageService;
    }

    public function show(Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        // Impedir checkout de agendamentos cancelados ou no_show
        if (in_array($appointment->status, [AppointmentStatus::Canceled->value, AppointmentStatus::NoShow->value])) {
            return redirect()->route('agenda')->with('error', 'Não é possível realizar checkout de agendamentos cancelados ou não comparecidos.');
        }

        $data = $this->checkoutService->prepareCheckoutData($appointment);

        // Fetch wallet and packages for the customer
        $customer = $appointment->customer;
        $data['wallet_balance'] = $customer?->wallet ? $customer->wallet->balance : 0;
        $data['available_packages'] = $customer ? $customer->customerPackages()
            ->with('package')
            ->where('status', 'active')
            ->get()
            ->filter(fn($cp) => $cp->isActive() && $cp->package->service_id === $appointment->service_id)
            ->values() : [];

        return Inertia::render('Agenda/Checkout', $data);
    }

    public function store(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $validated = $request->validate([
            'amount_received' => 'required|numeric|min:0.01',
            'received_at' => 'required|date',
            'method' => 'required|string',
            'fee_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'customer_package_id' => 'nullable|exists:customer_packages,id',
            'nps_score' => 'nullable|integer|min:0|max:10',
            'nps_comment' => 'nullable|string|max:1000',
        ]);

        if ($request->has('nps_score')) {
            $appointment->update([
                'nps_score' => $request->nps_score,
                'nps_comment' => $request->nps_comment,
            ]);
        }

        $charge = $this->checkoutService->ensureChargeForAppointment($appointment);
        
        if ($validated['method'] === 'wallet') {
            try {
                $this->checkoutService->payWithWallet($charge, $this->walletService);
                return redirect()->route('agenda')->with('success', 'Pagamento via Carteira realizado com sucesso.');
            } catch (\Exception $e) {
                return back()->withErrors(['method' => $e->getMessage()]);
            }
        }

        if ($validated['method'] === 'package') {
            $customerPackageId = $request->input('customer_package_id');
            $customerPackage = \App\Models\CustomerPackage::find($customerPackageId);

            if (!$customerPackage || $customerPackage->customer_id !== $appointment->customer_id) {
                return back()->withErrors(['method' => 'Pacote inválido.']);
            }

            try {
                $this->checkoutService->payWithPackage($charge, $customerPackage, $this->packageService);
                return redirect()->route('agenda')->with('success', 'Pagamento via Pacote realizado com sucesso.');
            } catch (\Exception $e) {
                return back()->withErrors(['method' => $e->getMessage()]);
            }
        }

        // Standard payment (cash, card, etc)
        // Check if amount exceeds balance
        $totalPaid = $charge->receipts()->sum('amount_received');
        $balance = $charge->amount - $totalPaid;

        if ($validated['amount_received'] > round($balance, 2)) {
             return back()->withErrors(['amount_received' => 'O valor recebido excede o saldo devedor.']);
        }

        $this->checkoutService->registerPayment($charge, $validated);

        return redirect()->route('agenda')->with('success', 'Pagamento registrado com sucesso.');
    }
}
