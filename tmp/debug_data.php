<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Customer;

$out = "--- CUSTOMERS DETAIL ---\n";
Customer::all()->each(function($c) use (&$out) {
    if ($c->phone == '67999999999') {
        $out .= "ID: {$c->id} | Name: {$c->name} | Phone: '{$c->phone}' (Len: " . strlen($c->phone) . ")\n";
    }
});

file_put_contents('d:/saas/agenda-pro/tmp/debug_output.txt', $out);
echo "Done\n";
