<?php
include 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\CustomerAuthController;
use App\Models\Clinic;
use Illuminate\Http\Request;

$clinic = Clinic::where('slug', 'demo-clinic')->first();
$request = new Request(['identifier' => 'joao@example.com']);
$controller = new CustomerAuthController();
$controller->sendToken($request, $clinic);

echo "Token triggered and logged" . PHP_EOL;
