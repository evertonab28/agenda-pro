<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MarkChargePaidRequest;
use App\Models\Charge;

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
}