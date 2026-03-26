<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Professional;
use App\Models\Service;
use Carbon\Carbon;

$prof = Professional::first();
$service = Service::first();
$dateStr = '2026-03-26';
$date = Carbon::parse($dateStr);
$weekday = $date->dayOfWeek;

$schedule = $prof->schedules()->where('weekday', $weekday)->where('is_active', true)->first();
$startTime = Carbon::parse($dateStr . ' ' . $schedule->start_time);
$endTime = Carbon::parse($dateStr . ' ' . $schedule->end_time);
$duration = $service->duration_minutes;

echo "Now: " . now()->toDateTimeString() . " (" . config('app.timezone') . ")\n";
echo "Slot Start Sample: " . $startTime->toDateTimeString() . "\n";
echo "GT check: " . ($startTime->gt(now()) ? "TRUE" : "FALSE") . "\n";

$slots = [];
$current = $startTime->copy();
while ($current->copy()->addMinutes($duration)->lte($endTime)) {
    $slotStart = $current->copy();
    $slotEnd = $current->copy()->addMinutes($duration);
    
    // Check break (simplified)
    $inBreak = false;
    
    if (!$inBreak) {
        if ($slotStart->gt(now())) {
            $slots[] = $slotStart->format('H:i');
        } else {
           // echo "Slot {$slotStart->format('H:i')} is NOT gt now\n";
        }
    }
    $current->addMinutes(30);
}

echo "Slots generated: " . count($slots) . "\n";
if (count($slots) > 0) echo "First slot: {$slots[0]}\n";
