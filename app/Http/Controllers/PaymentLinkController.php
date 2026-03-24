<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use Illuminate\Http\Request;

class PaymentLinkController extends Controller
{
    public function show(string $hash)
    {
        $charge = Charge::where('payment_link_hash', $hash)->firstOrFail();
        
        // TC-CHG-004: Bloquear se já pago
        if ($charge->status === 'paid') {
            return inertia('Payment/Paid', [
                'charge' => $charge->load('customer'),
            ]);
        }

        // TC-PLS-003: Bloquear se expirado
        if ($charge->payment_link_expires_at && $charge->payment_link_expires_at->isPast()) {
            return inertia('Payment/Expired', [
                'charge' => $charge->load('customer'),
            ]);
        }

        // Log do clique (TC-CHG-003)
        $charge->increment('payment_link_clicks');

        return inertia('Payment/DirectCheckout', [
            'charge' => $charge->load('customer'),
            'amount_formatted' => number_format($charge->amount, 2, ',', '.'),
        ]);
    }
}
