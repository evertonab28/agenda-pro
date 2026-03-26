<?php
include 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Appointment;
use App\Models\Charge;
use Illuminate\Support\Str;

$apt = Appointment::latest()->first();
if ($apt) {
    Charge::create([
        'clinic_id' => $apt->clinic_id,
        'customer_id' => $apt->customer_id,
        'appointment_id' => $apt->id,
        'amount' => 150.00,
        'status' => 'pending',
        'due_date' => now()->addDays(2),
        'payment_link_hash' => Str::random(32),
    ]);
    echo "Charge created for customer " . $apt->customer_id . PHP_EOL;
}
