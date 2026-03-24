<?php

use App\Services\DashboardService;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$service = new DashboardService();

echo "Testing DashboardService BI methods...\n";

try {
    echo "1. Testing getOccupancyHeatmap()...\n";
    $heatmap = $service->getOccupancyHeatmap();
    echo "   Result: " . count($heatmap) . " entries.\n";
    
    echo "2. Testing getRevenueComparison()...\n";
    $revenue = $service->getRevenueComparison();
    echo "   Result: Forecasted: {$revenue['forecasted']}, Realized: {$revenue['realized']}, Gap: {$revenue['gap']}\n";
    
    echo "3. Testing getNoShowRanking()...\n";
    $noShow = $service->getNoShowRanking();
    echo "   Result: " . count($noShow) . " entries.\n";
    
    echo "4. Testing getRetentionMetrics()...\n";
    $retention = $service->getRetentionMetrics();
    echo "   Result: Rate: {$retention['rate']}%\n";

    echo "\nVerification SUCCESSFUL!\n";
} catch (\Exception $e) {
    echo "\nVerification FAILED: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
    exit(1);
}
