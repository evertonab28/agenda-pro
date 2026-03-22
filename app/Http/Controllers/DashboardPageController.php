<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Charge;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class DashboardPageController extends Controller
{
    public function index()
    {
        $fromStr = request('from');
        $toStr = request('to');

        $from = $fromStr ? Carbon::parse($fromStr)->startOfDay() : now()->startOfMonth();
        $to = $toStr ? Carbon::parse($toStr)->endOfDay() : now()->endOfDay();

        $appointments = Appointment::whereBetween('starts_at', [$from, $to]);

        $total = (clone $appointments)->count();
        $confirmed = (clone $appointments)->where('status', 'confirmed')->count();
        $completed = (clone $appointments)->where('status', 'completed')->count();
        $noShow = (clone $appointments)->where('status', 'no_show')->count();

        $charges = Charge::whereHas('appointment', fn($q) => $q->whereBetween('starts_at', [$from, $to]));
        $pendingAmount = (clone $charges)->where('status', 'pending')->sum('amount');
        $paidAmount = (clone $charges)->where('status', 'paid')->sum('amount');
        $overdueAmount = (clone $charges)->where('status', 'overdue')->sum('amount');

        // Timeseries Data
        $appointmentsDaily = (clone $appointments)
            ->selectRaw('DATE(starts_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        $chargesDaily = (clone $charges)
            ->join('appointments', 'charges.appointment_id', '=', 'appointments.id')
            ->selectRaw('DATE(appointments.starts_at) as date, sum(amount) as total')
            ->whereIn('charges.status', ['paid', 'pending', 'overdue'])
            ->groupBy('date')
            ->pluck('total', 'date');

        $timeseries = [];
        $period = CarbonPeriod::create($from, $to);
        foreach ($period as $date) {
            $dateString = $date->format('Y-m-d');
            $timeseries[] = [
                'date' => $date->format('d/m'),
                'appointments' => $appointmentsDaily->get($dateString, 0),
                'revenue' => (float) $chargesDaily->get($dateString, 0),
            ];
        }

        // Pending Charges List
        $pendingChargesList = Charge::with('appointment.customer')
            ->whereIn('status', ['pending', 'overdue'])
            ->orderBy('due_date', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($charge) {
                return [
                    'id' => $charge->id,
                    'customer_name' => collect($charge->appointment->customer)->get('name', 'Desconhecido'),
                    'amount' => (float) $charge->amount,
                    'status' => $charge->status,
                    'due_date' => $charge->due_date ? $charge->due_date->format('Y-m-d') : null,
                ];
            });

        return Inertia::render('Dashboard/index', [
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
            'timeseries' => $timeseries,
            'pending_charges' => $pendingChargesList,
        ]);
    }
}