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
     * Pay a charge using wallet balance.
     */
    public function payWithWallet(Charge $charge, WalletService $walletService): Receipt
    {
        return DB::transaction(function () use ($charge, $walletService) {
            $customer = $charge->customer;
            
            // Debit from wallet
            $walletService->debit(
                $customer, 
                (float)$charge->amount, 
                "Pagamento da cobrança #{$charge->id}", 
                'charge', 
                $charge->id
            );

            // Register payment
            return $this->registerPayment($charge, [
                'amount_received' => $charge->amount,
                'method' => 'wallet',
                'received_at' => now(),
                'notes' => "Pago via Carteira",
            ]);
        });
    }

    /**
     * Pay a charge using a package session.
     */
    public function payWithPackage(Charge $charge, CustomerPackage $customerPackage, PackageService $packageService): void
    {
        DB::transaction(function () use ($charge, $customerPackage, $packageService) {
            // Consume session
            $packageService->consumeSession($customerPackage, $charge->appointment);

            // Mark charge as paid via package
            $charge->update([
                'status' => ChargeStatus::Paid->value,
                'paid_at' => now(),
                'notes' => ($charge->notes ? $charge->notes . "\n" : "") . "Pago via Pacote (ID: {$customerPackage->id})",
            ]);

            AuditService::log(auth()->user(), 'charge.paid_via_package', $charge, [
                'customer_package_id' => $customerPackage->id
            ]);
        });
    }

    public function finalizeAppointment(Appointment $appointment): void
    {
        if ($appointment->status !== AppointmentStatus::Completed->value) {
            $appointment->update(['status' => AppointmentStatus::Completed->value]);
            AuditService::log(auth()->user(), 'appointment.finalized', $appointment);
        }
    }

    /**
     * Generate a no-show fee charge if enabled in settings.
     */
    public function generateNoShowFee(Appointment $appointment): ?Charge
    {
        $enabled = \App\Models\Setting::get('no_show_fee_enabled', false);
        $amount = \App\Models\Setting::get('no_show_fee_amount', 0);

        if (!$enabled || $amount <= 0) {
            return null;
        }

        return $this->ensureChargeForAppointment($appointment, [
            'amount' => $amount,
            'description' => "Taxa de No-Show: " . ($appointment->service->name ?? 'Serviço'),
        ]);
    }
}
