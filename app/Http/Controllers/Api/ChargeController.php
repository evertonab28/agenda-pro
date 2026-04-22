<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MarkChargePaidRequest;
use App\Models\Charge;
use App\Models\Workspace;
use App\Services\FinanceService;

class ChargeController extends Controller
{
    public function markPaid(MarkChargePaidRequest $request, Charge $charge, FinanceService $financeService)
    {
        $this->authorize('update', $charge);
        $data = $request->validated();

        $financeService->markChargePaid($charge, [
            'payment_method' => $data['payment_method'],
            'paid_at' => $data['paid_at'] ?? now(),
            'notes' => 'Recebimento sintetico via API mark-paid.',
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
