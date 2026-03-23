<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Receipt;
use App\Enums\AppointmentStatus;
use App\Enums\ChargeStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class CheckoutService
{
    /**
     * Prepare data for the checkout screen.
     */
    public function prepareCheckoutData(Appointment $appointment): array
    {
        $appointment->load(['customer', 'professional', 'service', 'charge.receipts']);
        
        $charge = $appointment->charge;
        $receipts = $charge ? $charge->receipts : collect();
        $amountPaid = $charge ? $charge->receipts()->sum('amount_received') : 0;
        $balance = $charge ? max(0, $charge->amount - $amountPaid) : ($appointment->service->price ?? 0);

        return [
            'appointment' => $appointment,
            'customer' => $appointment->customer,
            'professional' => $appointment->professional,
            'service' => $appointment->service,
            'charge' => $charge,
            'receipts' => $receipts,
            'summary' => [
                'total_amount' => $charge ? $charge->amount : ($appointment->service->price ?? 0),
                'amount_paid' => $amountPaid,
                'balance' => $balance,
            ]
        ];
    }

    /**
     * Ensure a charge exists for the appointment.
     */
    public function ensureChargeForAppointment(Appointment $appointment, array $payload = []): Charge
    {
        return DB::transaction(function () use ($appointment, $payload) {
            $charge = Charge::where('appointment_id', $appointment->id)->first();

            if (!$charge) {
                $charge = Charge::create([
                    'appointment_id' => $appointment->id,
                    'customer_id' => $appointment->customer_id,
                    'amount' => $payload['amount'] ?? $appointment->service->price ?? 0,
                    'description' => "Atendimento: " . ($appointment->service->name ?? 'Serviço'),
                    'due_date' => now()->toDateString(),
                    'status' => ChargeStatus::Pending->value,
                ]);
                
                AuditService::log(auth()->user(), 'charge.auto_created', $charge, ['appointment_id' => $appointment->id]);
            }

            return $charge;
        });
    }

    /**
     * Register a payment for a charge.
     */
    public function registerPayment(Charge $charge, array $data): Receipt
    {
        return DB::transaction(function () use ($charge, $data) {
            $feeAmount = $data['fee_amount'] ?? 0;
            $netAmount = $data['amount_received'] - $feeAmount;

            $receipt = Receipt::create([
                'charge_id' => $charge->id,
                'amount_received' => $data['amount_received'],
                'fee_amount' => $feeAmount,
                'net_amount' => $netAmount,
                'method' => $data['method'],
                'received_at' => Carbon::parse($data['received_at']),
                'notes' => $data['notes'] ?? null,
            ]);

            // Update charge status and balance
            $totalReceived = $charge->receipts()->sum('amount_received');
            
            if ($totalReceived >= $charge->amount) {
                $charge->update([
                    'status' => ChargeStatus::Paid->value,
                    'paid_at' => Carbon::parse($data['received_at']),
                ]);
            } elseif ($totalReceived > 0) {
                $charge->update(['status' => ChargeStatus::Partial->value]);
            }

            AuditService::log(auth()->user(), 'charge.payment_registered', $charge, [
                'amount' => $data['amount_received'],
                'method' => $data['method']
            ]);

            return $receipt;
        });
    }

    /**
     * Finalize the appointment status.
     */
    public function finalizeAppointment(Appointment $appointment): void
    {
        if ($appointment->status !== AppointmentStatus::Completed->value) {
            $appointment->update(['status' => AppointmentStatus::Completed->value]);
            AuditService::log(auth()->user(), 'appointment.finalized', $appointment);
        }
    }
}
