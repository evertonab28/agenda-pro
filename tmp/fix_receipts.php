<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Receipt;
use App\Models\Charge;

echo "Starting receipt healing process...\n";

Receipt::withoutGlobalScopes()->whereNull('clinic_id')->get()->each(function($r) {
    if ($r->charge_id) {
        $charge = Charge::withoutGlobalScopes()->find($r->charge_id);
        if ($charge && $charge->clinic_id) {
            $r->update(['clinic_id' => $charge->clinic_id]);
            echo "Healed Receipt {$r->id} with Clinic ID {$charge->clinic_id}\n";
        } else {
            echo "Receipt {$r->id} has no valid charge or charge has no clinic_id (Charge ID: {$r->charge_id})\n";
        }
    } else {
        echo "Receipt {$r->id} has no charge_id\n";
    }
});

echo "Finished.\n";
