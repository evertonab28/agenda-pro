<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Package;
use App\Models\CustomerPackage;
use App\Models\Appointment;
use App\Models\Charge;
use App\Enums\ChargeStatus;
use Illuminate\Support\Facades\DB;
use Exception;

class PackageService
{
    /**
     * Sell a package to a customer.
     */
    public function sellPackage(Customer $customer, Package $package): CustomerPackage
    {
        return DB::transaction(function () use ($customer, $package) {
            $expiresAt = $package->validity_days > 0 ? now()->addDays($package->validity_days) : null;

            $customerPackage = CustomerPackage::create([
                'customer_id' => $customer->id,
                'package_id' => $package->id,
                'remaining_sessions' => $package->sessions_count,
                'expires_at' => $expiresAt,
                'status' => 'active',
            ]);

            // Automatically create a charge for the package purchase
            Charge::create([
                'customer_id' => $customer->id,
                'amount' => $package->price,
                'description' => "Compra de Pacote: " . $package->name,
                'due_date' => now()->toDateString(),
                'status' => ChargeStatus::Pending->value,
                'reference_type' => 'customer_package',
                'reference_id' => $customerPackage->id,
            ]);

            \App\Services\AuditService::log(
                auth()->user(), 
                'package.sold', 
                $customerPackage, 
                ['package' => $package->name, 'price' => $package->price]
            );

            return $customerPackage;
        });
    }

    /**
     * Consume one session from a customer package.
     */
    public function consumeSession(CustomerPackage $customerPackage, Appointment $appointment): void
    {
        if (!$customerPackage->isActive()) {
            throw new Exception("Este pacote não está mais ativo ou não possui sessões restantes.");
        }

        if ($customerPackage->package->service_id !== $appointment->service_id) {
            throw new Exception("Este pacote não é válido para este tipo de serviço.");
        }

        DB::transaction(function () use ($customerPackage, $appointment) {
            $customerPackage->decrement('remaining_sessions');
            
            if ($customerPackage->remaining_sessions <= 0) {
                $customerPackage->update(['status' => 'exhausted']);
            }

            // Link the appointment to the package session usage if needed
            // For now just logging could be enough or marking the charge as paid via package
            \App\Services\AuditService::log(
                auth()->user(), 
                'package.session_consumed', 
                $customerPackage, 
                ['appointment_id' => $appointment->id, 'service' => $appointment->service->name]
            );
        });
    }
}
