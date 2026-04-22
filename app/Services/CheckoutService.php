<?php

namespace App\Services;

use App\Enums\ChargeStatus;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\CustomerPackage;
use App\Models\Receipt;
use Illuminate\Support\Facades\DB;

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
            ],
        ];
    }

    /**
     * Ensure a charge exists for the appointment.
     */
    public function ensureChargeForAppointment(Appointment $appointment, array $payload = []): Charge
    {
        return DB::transaction(function () use ($appointment, $payload) {
            $appointment->loadMissing('service');

            // Search bypasses scope just in case of orphaned records, but filtered by the specific appointment.
            $charge = Charge::withoutGlobalScopes()
                ->where('appointment_id', $appointment->id)
                ->lockForUpdate()
                ->first();

            if (!$charge) {
                $charge = Charge::create([
                    'workspace_id' => $appointment->workspace_id,
                    'appointment_id' => $appointment->id,
                    'customer_id' => $appointment->customer_id,
                    'amount' => $payload['amount'] ?? $appointment->service->price ?? 0,
                    'description' => $payload['description'] ?? ('Atendimento: ' . ($appointment->service->name ?? 'Servico')),
                    'due_date' => $payload['due_date'] ?? $appointment->starts_at->toDateString(),
                    'status' => ChargeStatus::Pending->value,
                ]);

                AuditService::log(auth()->user(), 'charge.auto_created', $charge, [
                    'appointment_id' => $appointment->id,
                ]);
            } elseif ($charge->workspace_id === null || $charge->customer_id === null) {
                $charge->update([
                    'workspace_id' => $charge->workspace_id ?? $appointment->workspace_id,
                    'customer_id' => $charge->customer_id ?? $appointment->customer_id,
                ]);
            }

            return $charge;
        });
    }

    /**
     * Register a payment for a charge.
     */
    public function registerPayment(Charge $charge, array $data): Receipt
    {
        return app(FinanceService::class)->receivePayment($charge, $data, auth()->user());
    }

    /**
     * Pay a charge using wallet balance.
     */
    public function payWithWallet(Charge $charge, WalletService $walletService): Receipt
    {
        return DB::transaction(function () use ($charge, $walletService) {
            $customer = $charge->customer;

            $walletService->debit(
                $customer,
                (float) $charge->amount,
                "Pagamento da cobranca #{$charge->id}",
                'charge',
                $charge->id
            );

            return $this->registerPayment($charge, [
                'amount_received' => $charge->amount,
                'method' => 'wallet',
                'received_at' => now(),
                'notes' => 'Pago via Carteira',
            ]);
        });
    }

    /**
     * Pay a charge using a package session.
     */
    public function payWithPackage(Charge $charge, CustomerPackage $customerPackage, PackageService $packageService): void
    {
        DB::transaction(function () use ($charge, $customerPackage, $packageService) {
            $packageService->consumeSession($customerPackage, $charge->appointment);

            app(FinanceService::class)->markChargePaid($charge, [
                'method' => 'package',
                'paid_at' => now(),
                'notes' => "Recebimento via pacote (ID: {$customerPackage->id}).",
            ], auth()->user());

            $freshCharge = $charge->fresh();
            $freshCharge->update([
                'notes' => ($freshCharge->notes ? $freshCharge->notes . "\n" : '') . "Pago via Pacote (ID: {$customerPackage->id})",
            ]);

            AuditService::log(auth()->user(), 'charge.paid_via_package', $charge, [
                'customer_package_id' => $customerPackage->id,
            ]);
        });
    }

    public function finalizeAppointment(Appointment $appointment): void
    {
        app(AppointmentLifecycleService::class)->complete($appointment, auth()->user());
    }

    /**
     * Generate a no-show fee charge if enabled in settings.
     */
    public function generateNoShowFee(Appointment $appointment): ?Charge
    {
        return $this->ensureNoShowFeeForAppointment($appointment);
    }

    /**
     * No-show fee policy:
     * - born only when the lifecycle transitions an appointment to no_show;
     * - depends on workspace settings no_show_fee_enabled/no_show_fee_amount;
     * - coexists with the normal appointment charge by using reference_type/reference_id;
     * - repeated calls return the existing no-show fee charge instead of duplicating it.
     */
    public function ensureNoShowFeeForAppointment(Appointment $appointment): ?Charge
    {
        return DB::transaction(function () use ($appointment) {
            $appointment->loadMissing('service');

            $existing = Charge::withoutGlobalScopes()
                ->where('reference_type', 'no_show_fee')
                ->where('reference_id', $appointment->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $existing;
            }

            $enabled = \App\Models\Setting::getForWorkspace($appointment->workspace_id, 'no_show_fee_enabled', false);
            $amount = \App\Models\Setting::getForWorkspace($appointment->workspace_id, 'no_show_fee_amount', 0);

            $enabled = filter_var($enabled, FILTER_VALIDATE_BOOLEAN);
            $amount = (float) $amount;

            if (!$enabled || $amount <= 0) {
                return null;
            }

            $charge = Charge::create([
                'workspace_id' => $appointment->workspace_id,
                'appointment_id' => null,
                'customer_id' => $appointment->customer_id,
                'amount' => $amount,
                'description' => 'Taxa de No-Show: ' . ($appointment->service->name ?? 'Servico'),
                'due_date' => $appointment->starts_at->toDateString(),
                'status' => ChargeStatus::Pending->value,
                'reference_type' => 'no_show_fee',
                'reference_id' => $appointment->id,
            ]);

            AuditService::log(auth()->user(), 'charge.no_show_fee_created', $charge, [
                'appointment_id' => $appointment->id,
            ]);

            return $charge;
        });
    }
}
