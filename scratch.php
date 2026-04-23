<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \Auth::login(\App\Models\User::first());
    $request = new \App\Http\Requests\DashboardFilterRequest();
    // mock validate method to return empty array
    $request->setContainer(app())->setRedirector(app(\Illuminate\Routing\Redirector::class));
    
    $controller = app(\App\Http\Controllers\DashboardPageController::class);
    $response = $controller->index($request);
    
    echo "OK";
} catch (\Exception $e) {
    echo $e->getMessage() . "\n";
    echo $e->getFile() . ':' . $e->getLine() . "\n";
}
