<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use Illuminate\Http\Request;

class PaymentLinkController extends Controller
{
    public function show(string $hash)
    {
        $charge = Charge::where('payment_link_hash', $hash)->firstOrFail();
        
        $publicCustomer = [
            'name' => $charge->customer?->name,
            // Apenas o primeiro nome para a UI
            'first_name' => explode(' ', trim($charge->customer?->name))[0] ?? '',
        ];

        // TC-CHG-004: Bloquear se já pago
        if ($charge->status === 'paid') {
            return inertia('Payment/Paid', [
                'charge' => $charge->only(['id', 'amount', 'description', 'status', 'due_date']),
                'customer' => $publicCustomer,
            ]);
        }

        // TC-PLS-003: Bloquear se expirado
        if ($charge->payment_link_expires_at && $charge->payment_link_expires_at->isPast()) {
            return inertia('Payment/Expired', [
                'charge' => $charge->only(['id', 'amount', 'description', 'status', 'due_date']),
                'customer' => $publicCustomer,
            ]);
        }

        // Log do clique (TC-CHG-003)
        $charge->increment('payment_link_clicks');

        return inertia('Payment/DirectCheckout', [
            'charge' => $charge->only(['id', 'amount', 'description', 'status', 'due_date']),
            'customer' => $publicCustomer,
            'amount_formatted' => number_format($charge->amount, 2, ',', '.'),
        ]);
    }
}
