<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use App\Models\User;
use App\Models\Charge;
use Illuminate\Support\Facades\Gate;

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$app->instance('request', $request);

// Simulate login of the first user
$user = User::first();
if ($user) {
    echo "User: {$user->name} (Role: {$user->role})\n";
    $canView = Gate::forUser($user)->allows('viewAny', Charge::class);
    $canCreate = Gate::forUser($user)->allows('create', Charge::class);
    echo "Can View Any Charge: " . ($canView ? 'YES' : 'NO') . "\n";
    echo "Can Create Charge: " . ($canCreate ? 'YES' : 'NO') . "\n";
} else {
    echo "No users found.\n";
}
