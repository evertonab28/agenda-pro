<?php

namespace App\Services;

use App\Models\Charge;
use App\Models\Receipt;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use App\Services\AuditService;

class FinanceService
{
    public function getDashboardMetrics(Carbon $startDate, Carbon $endDate)
    {
        // Filter charges by due_date or paid_at within the period?
        // Let's consider the period for 'due_date' for expected/pending/overdue
        // and 'received_at' for actual receipts? 
        // For simplicity, let's filter by created_at or due_date. We will use due_date for expected.

        $charges = Charge::whereBetween('due_date', [$startDate, $endDate])->get();
        
        $received = $charges->whereIn('status', ['paid', 'partial'])->sum(function ($charge) {
            return $charge->receipts()->sum('amount_received'); // This might trigger N+1 if not eager loaded, so let's use relations on query level or eager load.
        });

        // Better to use queries
        $query = Charge::whereBetween('due_date', [$startDate, $endDate]);

        $pendingAmount = (clone $query)->whereIn('status', ['pending', 'partial'])->sum('amount');
        // This calculates total original amount. We actually need amount - received for pending.
        // It's better to calculate pure sums.
        
        // Let's refine this to be precise:
        // Recebidos no período: All receipts within the date range.
        $receivedAmount = \App\Models\Receipt::whereBetween('received_at', [$startDate, $endDate])->sum('amount_received');

        // Pendente no período: Charges created or due in this period that are not fully paid.
        // We'll calculate the total amount of these charges minus their receipts.
        $pendingCharges = Charge::whereBetween('due_date', [$startDate, $endDate])
            ->whereIn('status', ['pending', 'partial'])
            ->withSum('receipts', 'amount_received')
            ->get();
        $pendingAmount = $pendingCharges->sum('amount') - $pendingCharges->sum('receipts_sum_amount_received');

        // Vencido no período
        $overdueCharges = Charge::whereBetween('due_date', [$startDate, $endDate])
            ->where('status', 'overdue')
            ->withSum('receipts', 'amount_received')
            ->get();
        $overdueAmount = $overdueCharges->sum('amount') - $overdueCharges->sum('receipts_sum_amount_received');

        // Ticket Médio (Overall charges amount / count)
        $totalChargesCount = Charge::whereBetween('due_date', [$startDate, $endDate])->count();
        $totalChargesAmount = Charge::whereBetween('due_date', [$startDate, $endDate])->sum('amount');
        $averageTicket = $totalChargesCount > 0 ? $totalChargesAmount / $totalChargesCount : 0;

        // Inadimplência
        // Overdue Amount / (Received Amount + Pending Amount + Overdue Amount)
        // or Overdue count / Total count
        $totalExpected = $totalChargesAmount;
        $defaultRate = $totalExpected > 0 ? ($overdueAmount / $totalExpected) * 100 : 0;

        return [
            'received'      => $receivedAmount,
            'pending'       => $pendingAmount,
            'overdue'       => $overdueAmount,
            'averageTicket' => $averageTicket,
            'defaultRate'   => $defaultRate,
        ];
    }

    /**
     * Daily receipts time-series for finance charts.
     * Returns: [['date' => 'YYYY-MM-DD', 'total' => float], ...]
     */
    public function getDailyReceipts(Carbon $startDate, Carbon $endDate): array
    {
        return \App\Models\Receipt::whereBetween('received_at', [$startDate, $endDate])
            ->selectRaw('DATE(received_at) as date, SUM(amount_received) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'date'  => $row->date,
                'total' => (float) $row->total,
            ])
            ->toArray();
    }

    /**
     * Breakdown of receipts by payment method.
     * Returns: [['method' => string, 'total' => float, 'count' => int], ...]
     */
    public function getPaymentMethodBreakdown(Carbon $startDate, Carbon $endDate): array
    {
        return \App\Models\Receipt::whereBetween('received_at', [$startDate, $endDate])
            ->selectRaw('method, SUM(amount_received) as total, COUNT(*) as count')
            ->groupBy('method')
            ->orderByDesc('total')
            ->get()
            ->map(fn($row) => [
                'method' => $row->method,
                'total'  => (float) $row->total,
                'count'  => (int) $row->count,
            ])
            ->toArray();
    }

    /**
     * Register a payment for a charge and update its status.
     */
    public function receivePayment(Charge $charge, array $data, $user = null): Receipt
    {
        return DB::transaction(function () use ($charge, $data, $user) {
            $charge->loadSum('receipts', 'amount_received');
            $amountReceivedSoFar = $charge->receipts_sum_amount_received ?? 0;
            
            $feeAmount = $data['fee_amount'] ?? 0;
            $netAmount = $data['amount_received'] - $feeAmount;

            $receipt = Receipt::create([
                'clinic_id' => $charge->clinic_id,
                'charge_id' => $charge->id,
                'amount_received' => $data['amount_received'],
                'fee_amount' => $feeAmount,
                'net_amount' => $netAmount,
                'method' => $data['method'],
                'received_at' => Carbon::parse($data['received_at']),
                'notes' => $data['notes'] ?? null,
            ]);

            // Re-calculate
            $newReceivedSum = $amountReceivedSoFar + $data['amount_received'];
            
            if ($newReceivedSum >= $charge->amount) {
                $charge->update([
                    'status' => 'paid',
                    'paid_at' => Carbon::parse($data['received_at']),
                ]);
            } else {
                $charge->update(['status' => 'partial']);
            }

            if ($user) {
                AuditService::log($user, 'charge.receipt_registered', $charge, [
                    'amount' => $data['amount_received'],
                    'method' => $data['method'],
                ]);
            }

            return $receipt;
        });
    }
}
