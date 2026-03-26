<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Charge;

$out = "--- CHARGES DETAIL ---\n";
Charge::withoutGlobalScopes()->get()->each(function($c) use (&$out) {
    if ($c->appointment_id == 7) {
        $out .= "ID: {$c->id} | Appointment: {$c->appointment_id} | Clinic: " . ($c->clinic_id ?? 'NULL') . " | Customer: {$c->customer_id} | Amount: {$c->amount}\n";
    }
});

file_put_contents('d:/saas/agenda-pro/tmp/charge_debug.txt', $out);
echo "Done\n";
