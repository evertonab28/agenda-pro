<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Charge;

class DashboardPageController extends Controller
{
public function index()
{
$from = now()->startOfMonth();
$to = now()->endOfDay();

$appointments = Appointment::whereBetween('starts_at', [$from, $to]);

$total = (clone $appointments)->count();
$confirmed = (clone $appointments)->where('status', 'confirmed')->count();
$completed = (clone $appointments)->where('status', 'completed')->count();
$noShow = (clone $appointments)->where('status', 'no_show')->count();

$charges = Charge::whereHas('appointment', fn($q) => $q->whereBetween('starts_at', [$from, $to]));
$pendingAmount = (clone $charges)->where('status', 'pending')->sum('amount');
$paidAmount = (clone $charges)->where('status', 'paid')->sum('amount');
$overdueAmount = (clone $charges)->where('status', 'overdue')->sum('amount');
return Inertia::render('Dashboard/Index', [
'overview' => [
'range' => ['from' => $from->toDateTimeString(), 'to' => $to->toDateTimeString()],
'cards' => [
'appointments_total' => $total,
'appointments_confirmed' => $confirmed,
'appointments_completed' => $completed,
'appointments_no_show' => $noShow,
'confirmation_rate' => $total > 0 ? round(($confirmed / $total) * 100, 2) : 0,
'no_show_rate' => $total > 0 ? round(($noShow / $total) * 100, 2) : 0,
'pending_amount' => (float)$pendingAmount,
'paid_amount' => (float)$paidAmount,
'overdue_amount' => (float)$overdueAmount,
],
],
]);
}
}