<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Charge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
public function overview(Request $request)
{
[$from, $to] = $this->resolveRange($request);

$appointmentsBase = Appointment::query()
->whereBetween('starts_at', [$from, $to]);

$totalAppointments = (clone $appointmentsBase)->count();
$confirmed = (clone $appointmentsBase)->where('status', 'confirmed')->count();
$noShow = (clone $appointmentsBase)->where('status', 'no_show')->count();
$completed = (clone $appointmentsBase)->where('status', 'completed')->count();

$confirmationRate = $totalAppointments > 0 ? round(($confirmed / $totalAppointments) * 100, 2) : 0;
$noShowRate = $totalAppointments > 0 ? round(($noShow / $totalAppointments) * 100, 2) : 0;

$chargesBase = Charge::query()
->whereHas('appointment', fn($q) => $q->whereBetween('starts_at', [$from, $to]));

$pendingAmount = (clone $chargesBase)->where('status', 'pending')->sum('amount');
$paidAmount = (clone $chargesBase)->where('status', 'paid')->sum('amount');
$overdueAmount = (clone $chargesBase)->where('status', 'overdue')->sum('amount');

return response()->json([
'range' => [
'from' => $from->toDateTimeString(),
'to' => $to->toDateTimeString(),
],
'cards' => [
'appointments_total' => $totalAppointments,
'appointments_confirmed' => $confirmed,
'appointments_completed' => $completed,
'appointments_no_show' => $noShow,
'confirmation_rate' => $confirmationRate,
'no_show_rate' => $noShowRate,
'pending_amount' => (float) $pendingAmount,
'paid_amount' => (float) $paidAmount,
'overdue_amount' => (float) $overdueAmount,
],
]);
}

public function timeseries(Request $request)
{
[$from, $to] = $this->resolveRange($request);

$rows = Appointment::query()
->selectRaw("DATE(starts_at) as day")
->selectRaw("COUNT(*) as total")
->selectRaw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
->selectRaw("SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show")
->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
->whereBetween('starts_at', [$from, $to])
->groupBy(DB::raw('DATE(starts_at)'))
->orderBy('day')
->get();

return response()->json([
'range' => [
'from' => $from->toDateTimeString(),
'to' => $to->toDateTimeString(),
],
'series' => $rows,
]);
}

public function pendingCharges(Request $request)
{
[$from, $to] = $this->resolveRange($request);

$charges = Charge::with(['appointment.customer'])
->whereIn('status', ['pending', 'overdue'])
->whereHas('appointment', fn($q) => $q->whereBetween('starts_at', [$from, $to]))
->orderBy('due_date')
->paginate(20);

return response()->json($charges);
}

private function resolveRange(Request $request): array
{
$from = $request->filled('from')
? Carbon::parse($request->input('from'))->startOfDay()
: now()->startOfMonth();

$to = $request->filled('to')
? Carbon::parse($request->input('to'))->endOfDay()
: now()->endOfDay();

return [$from, $to];
}
}