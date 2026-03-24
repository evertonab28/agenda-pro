<?php
namespace App\Services;

require __DIR__.'/vendor/autoload.php';

use App\Services\DashboardService;

$service = new DashboardService();
echo "Heatmap: " . (method_exists($service, 'getOccupancyHeatmap') ? 'Yes' : 'No') . "\n";
echo "Revenue: " . (method_exists($service, 'getRevenueComparison') ? 'Yes' : 'No') . "\n";
echo "Ranking: " . (method_exists($service, 'getNoShowRanking') ? 'Yes' : 'No') . "\n";
echo "Retention: " . (method_exists($service, 'getRetentionMetrics') ? 'Yes' : 'No') . "\n";
