<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Charge;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "Testing Charge Show for ID 6...\n";

$user = User::withoutGlobalScopes()->find(1);
echo "User 1 Clinic ID: " . ($user->clinic_id ?? 'NULL') . "\n";
Auth::login($user);

$charge = Charge::find(6);
if ($charge) {
    echo "Charge 6 found! Clinic ID: " . ($charge->clinic_id ?? 'NULL') . "\n";
} else {
    echo "Charge 6 NOT found (filtered).\n";
    // Now try without scope
    $charge = Charge::withoutGlobalScopes()->find(6);
    if ($charge) {
        echo "Charge 6 exists without scope. Clinic ID: " . ($charge->clinic_id ?? 'NULL') . "\n";
    }
}

echo "Finished.\n";
