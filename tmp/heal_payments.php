<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Charge;

echo "Healing payment statuses...\n";

Charge::withoutGlobalScopes()->get()->each(function($c) {
    $sum = (float)$c->receipts()->sum('amount_received');
    $amount = (float)$c->amount;
    
    if (round($sum, 2) >= round($amount, 2) && $c->status !== 'paid') {
        $lastReceipt = $c->receipts()->latest()->first();
        $c->update([
            'status' => 'paid',
            'paid_at' => $lastReceipt ? $lastReceipt->received_at : now()
        ]);
        echo "Healed Charge {$c->id} to 'paid' (Sum: {$sum}, Amount: {$amount})\n";
    } elseif (round($sum, 2) > 0 && round($sum, 2) < round($amount, 2) && $c->status !== 'partial') {
        $c->update(['status' => 'partial']);
        echo "Healed Charge {$c->id} to 'partial' (Sum: {$sum}, Amount: {$amount})\n";
    }
});

echo "Finished.\n";
