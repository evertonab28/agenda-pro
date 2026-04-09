<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MarkChargePaidRequest;
use App\Models\Charge;
use App\Models\Workspace;

class ChargeController extends Controller
{
    public function markPaid(MarkChargePaidRequest $request, Charge $charge)
    {
        $this->authorize('update', $charge);
        $data = $request->validated();

        $charge->update([
            'status' => 'paid',
            'payment_method' => $data['payment_method'],
            'paid_at' => $data['paid_at'] ?? now(),
        ]);

        return $charge->fresh();
    }

    public function portalIndex(Workspace $workspace)
    {
        return response()->json(
            Charge::where('customer_id', auth('customer')->id())
                ->where('status', 'pending')
                ->latest()
                ->get()
        );
    }
}
