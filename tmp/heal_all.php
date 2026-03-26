<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Charge;
use App\Models\Receipt;
use App\Models\Appointment;
use App\Models\Customer;

echo "Starting full healing process...\n";

// Heal Charges
Charge::withoutGlobalScopes()->whereNull('clinic_id')->get()->each(function($c) {
    $clinicId = null;
    if ($c->appointment_id) {
        $appt = Appointment::withoutGlobalScopes()->find($c->appointment_id);
        $clinicId = $appt ? $appt->clinic_id : null;
    } 
    
    if (!$clinicId && $c->customer_id) {
        $customer = Customer::withoutGlobalScopes()->find($c->customer_id);
        $clinicId = $customer ? $customer->clinic_id : null;
    }

    if ($clinicId) {
        $c->update(['clinic_id' => $clinicId]);
        echo "Healed Charge {$c->id} with Clinic ID {$clinicId}\n";
    } else {
        echo "Could not find clinic for Charge {$c->id}\n";
    }
});

// Heal Receipts
Receipt::withoutGlobalScopes()->whereNull('clinic_id')->get()->each(function($r) {
    if ($r->charge_id) {
        $charge = Charge::withoutGlobalScopes()->find($r->charge_id);
        if ($charge && $charge->clinic_id) {
            $r->update(['clinic_id' => $charge->clinic_id]);
            echo "Healed Receipt {$r->id} with Clinic ID {$charge->clinic_id}\n";
        }
    }
});

echo "Finished.\n";
