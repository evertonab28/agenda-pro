<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Charge;

$out = "--- RECENT CHARGES & RECEIPTS ---\n";
Charge::withoutGlobalScopes()->latest()->limit(5)->get()->each(function($c) use (&$out) {
    $receiptsCount = $c->receipts()->count();
    $receiptsSum = $c->receipts()->sum('amount_received');
    $out .= "Charge ID: {$c->id} | Appt ID: {$c->appointment_id} | Amount: {$c->amount} | Status: {$c->status} | Receipts Count: {$receiptsCount} | Receipts Sum: {$receiptsSum}\n";
    
    $c->receipts->each(function($r) use (&$out) {
        $out .= "  -> Receipt ID: {$r->id} | Amount: {$r->amount_received} | Date: {$r->received_at}\n";
    });
});

file_put_contents('d:/saas/agenda-pro/tmp/payment_debug.txt', $out);
echo "Done\n";
