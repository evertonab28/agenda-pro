<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Exception;

class WalletService
{
    /**
     * Get or create a wallet for a customer.
     */
    public function getOrCreateWallet(Customer $customer): Wallet
    {
        return Wallet::firstOrCreate(
            ['customer_id' => $customer->id],
            ['balance' => 0]
        );
    }

    /**
     * Add funds to customer wallet.
     */
    public function credit(Customer $customer, float $amount, string $description, string $refType = null, int $refId = null): WalletTransaction
    {
        return DB::transaction(function () use ($customer, $amount, $description, $refType, $refId) {
            $wallet = $this->getOrCreateWallet($customer);
            
            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'amount' => $amount,
                'type' => 'credit',
                'description' => $description,
                'reference_type' => $refType,
                'reference_id' => $refId
            ]);

            $wallet->increment('balance', $amount);

            \App\Services\AuditService::log(
                auth()->user(), 
                'wallet.credited', 
                $customer, 
                ['amount' => $amount, 'description' => $description, 'ref_type' => $refType, 'ref_id' => $refId]
            );
            
            return $transaction;
        });
    }

    /**
     * Deduct funds from customer wallet.
     */
    public function debit(Customer $customer, float $amount, string $description, string $refType = null, int $refId = null): WalletTransaction
    {
        return DB::transaction(function () use ($customer, $amount, $description, $refType, $refId) {
            $wallet = $this->getOrCreateWallet($customer);

            if ($wallet->balance < $amount) {
                throw new Exception("Saldo insuficiente na carteira (Saldo: R$" . number_format($wallet->balance, 2, ',', '.') . ")");
            }

            $transaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'amount' => $amount,
                'type' => 'debit',
                'description' => $description,
                'reference_type' => $refType,
                'reference_id' => $refId
            ]);

            $wallet->decrement('balance', $amount);

            \App\Services\AuditService::log(
                auth()->user(), 
                'wallet.debited', 
                $customer, 
                ['amount' => $amount, 'description' => $description, 'ref_type' => $refType, 'ref_id' => $refId]
            );
            
            return $transaction;
        });
    }
}
