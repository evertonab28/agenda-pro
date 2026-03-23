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

    public function __construct(CheckoutService $checkoutService)
    {
        $this->checkoutService = $checkoutService;
    }

    public function show(Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        // Impedir checkout de agendamentos cancelados ou no_show
        if (in_array($appointment->status, [AppointmentStatus::Canceled->value, AppointmentStatus::NoShow->value])) {
            return redirect()->route('agenda')->with('error', 'Não é possível realizar checkout de agendamentos cancelados ou não comparecidos.');
        }

        $data = $this->checkoutService->prepareCheckoutData($appointment);

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
        ]);

        $charge = $this->checkoutService->ensureChargeForAppointment($appointment);
        
        // Check if amount exceeds balance (unless partial allowed, but we follow business rule)
        $totalPaid = $charge->receipts()->sum('amount_received');
        $balance = $charge->amount - $totalPaid;

        if ($validated['amount_received'] > round($balance, 2)) {
             return back()->withErrors(['amount_received' => 'O valor recebido excede o saldo devedor.']);
        }

        $this->checkoutService->registerPayment($charge, $validated);

        return redirect()->route('agenda')->with('success', 'Pagamento registrado com sucesso.');
    }
}
