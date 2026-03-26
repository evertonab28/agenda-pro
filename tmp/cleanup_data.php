<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Customer;
use App\Models\CustomerAuthToken;

$idToDelete = 3;
$idToKeep = 2;

$customer = Customer::find($idToDelete);
if ($customer) {
    // Delete tokens too
    CustomerAuthToken::where('customer_id', $idToDelete)->delete();
    $customer->delete();
    echo "Deleted ID $idToDelete\n";
} else {
    echo "ID $idToDelete not found\n";
}
