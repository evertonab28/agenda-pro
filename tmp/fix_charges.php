<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Charge;
use App\Models\Appointment;

echo "Starting healing process...\n";

Charge::withoutGlobalScopes()->whereNull('clinic_id')->get()->each(function($c) {
    if ($c->appointment_id) {
        $appt = Appointment::withoutGlobalScopes()->find($c->appointment_id);
        if ($appt) {
            $c->update(['clinic_id' => $appt->clinic_id]);
            echo "Healed Charge {$c->id} with Clinic ID {$appt->clinic_id}\n";
        } else {
            echo "Charge {$c->id} has no valid appointment (ID: {$c->appointment_id})\n";
        }
    } else {
        echo "Charge {$c->id} has no appointment_id\n";
    }
});

echo "Finished.\n";
