<?php

namespace Tests\Feature\Finance;

use App\Models\Customer;
use App\Models\CustomerPackage;
use App\Models\Package;
use App\Models\Service;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialMultiTenantTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------
    // Wallet tests
    // ---------------------------------------------------------------

    public function test_wallet_stores_and_retrieves_workspace_id(): void
    {
        $workspace = Workspace::factory()->create();
        $customer  = Customer::factory()->create(['workspace_id' => $workspace->id]);

        $wallet = Wallet::create([
            'customer_id'  => $customer->id,
            'workspace_id' => $workspace->id,
            'balance'      => 0,
        ]);

        $this->assertDatabaseHas('wallets', [
            'id'           => $wallet->id,
            'workspace_id' => $workspace->id,
        ]);

        $this->assertEquals($workspace->id, $wallet->fresh()->workspace_id);
    }

    public function test_wallets_scoped_by_workspace_return_correct_records(): void
    {
        $wsA = Workspace::factory()->create();
        $wsB = Workspace::factory()->create();

        $customerA = Customer::factory()->create(['workspace_id' => $wsA->id]);
        $customerB = Customer::factory()->create(['workspace_id' => $wsB->id]);

        Wallet::create(['customer_id' => $customerA->id, 'workspace_id' => $wsA->id, 'balance' => 0]);
        Wallet::create(['customer_id' => $customerB->id, 'workspace_id' => $wsB->id, 'balance' => 0]);

        $walletsA = Wallet::where('workspace_id', $wsA->id)->get();
        $walletsB = Wallet::where('workspace_id', $wsB->id)->get();

        $this->assertCount(1, $walletsA);
        $this->assertCount(1, $walletsB);
        $this->assertEquals($customerA->id, $walletsA->first()->customer_id);
        $this->assertEquals($customerB->id, $walletsB->first()->customer_id);
    }

    // ---------------------------------------------------------------
    // WalletTransaction tests
    // ---------------------------------------------------------------

    public function test_wallet_transaction_stores_workspace_id(): void
    {
        $workspace = Workspace::factory()->create();
        $customer  = Customer::factory()->create(['workspace_id' => $workspace->id]);

        $wallet = Wallet::create([
            'customer_id'  => $customer->id,
            'workspace_id' => $workspace->id,
            'balance'      => 100,
        ]);

        $txn = WalletTransaction::create([
            'wallet_id'    => $wallet->id,
            'workspace_id' => $workspace->id,
            'amount'       => 50,
            'type'         => 'credit',
            'description'  => 'Test credit',
        ]);

        $this->assertDatabaseHas('wallet_transactions', [
            'id'           => $txn->id,
            'workspace_id' => $workspace->id,
        ]);

        $this->assertEquals($workspace->id, $txn->fresh()->workspace_id);
    }

    public function test_wallet_transactions_scoped_by_workspace_return_correct_records(): void
    {
        $wsA = Workspace::factory()->create();
        $wsB = Workspace::factory()->create();

        $customerA = Customer::factory()->create(['workspace_id' => $wsA->id]);
        $customerB = Customer::factory()->create(['workspace_id' => $wsB->id]);

        $walletA = Wallet::create(['customer_id' => $customerA->id, 'workspace_id' => $wsA->id, 'balance' => 0]);
        $walletB = Wallet::create(['customer_id' => $customerB->id, 'workspace_id' => $wsB->id, 'balance' => 0]);

        // 2 transactions for workspace A
        WalletTransaction::create(['wallet_id' => $walletA->id, 'workspace_id' => $wsA->id, 'amount' => 10, 'type' => 'credit']);
        WalletTransaction::create(['wallet_id' => $walletA->id, 'workspace_id' => $wsA->id, 'amount' => 5,  'type' => 'debit']);

        // 1 transaction for workspace B
        WalletTransaction::create(['wallet_id' => $walletB->id, 'workspace_id' => $wsB->id, 'amount' => 20, 'type' => 'credit']);

        $txnsA = WalletTransaction::where('workspace_id', $wsA->id)->get();
        $txnsB = WalletTransaction::where('workspace_id', $wsB->id)->get();

        $this->assertCount(2, $txnsA);
        $this->assertCount(1, $txnsB);
    }

    // ---------------------------------------------------------------
    // CustomerPackage tests
    // ---------------------------------------------------------------

    public function test_customer_package_stores_workspace_id(): void
    {
        $workspace = Workspace::factory()->create();
        $customer  = Customer::factory()->create(['workspace_id' => $workspace->id]);

        $service = Service::create([
            'workspace_id'     => $workspace->id,
            'name'             => 'Massagem',
            'duration_minutes' => 60,
            'price'            => 80.00,
            'is_active'        => true,
        ]);

        $package = Package::create([
            'service_id'     => $service->id,
            'name'           => 'Pacote 5 Sessões',
            'sessions_count' => 5,
            'price'          => 350.00,
            'validity_days'  => 90,
            'is_active'      => true,
        ]);

        $cp = CustomerPackage::create([
            'customer_id'        => $customer->id,
            'package_id'         => $package->id,
            'workspace_id'       => $workspace->id,
            'remaining_sessions' => 5,
            'status'             => 'active',
        ]);

        $this->assertDatabaseHas('customer_packages', [
            'id'           => $cp->id,
            'workspace_id' => $workspace->id,
        ]);

        $this->assertEquals($workspace->id, $cp->fresh()->workspace_id);
    }

    public function test_customer_packages_scoped_by_workspace_return_correct_records(): void
    {
        $wsA = Workspace::factory()->create();
        $wsB = Workspace::factory()->create();

        $customerA = Customer::factory()->create(['workspace_id' => $wsA->id]);
        $customerB = Customer::factory()->create(['workspace_id' => $wsB->id]);

        $serviceA = Service::create([
            'workspace_id'     => $wsA->id,
            'name'             => 'Corte A',
            'duration_minutes' => 30,
            'price'            => 50.00,
            'is_active'        => true,
        ]);

        $serviceB = Service::create([
            'workspace_id'     => $wsB->id,
            'name'             => 'Corte B',
            'duration_minutes' => 30,
            'price'            => 50.00,
            'is_active'        => true,
        ]);

        $packageA = Package::create([
            'service_id'     => $serviceA->id,
            'name'           => 'Combo A',
            'sessions_count' => 3,
            'price'          => 120.00,
            'validity_days'  => 60,
            'is_active'      => true,
        ]);

        $packageB = Package::create([
            'service_id'     => $serviceB->id,
            'name'           => 'Combo B',
            'sessions_count' => 3,
            'price'          => 120.00,
            'validity_days'  => 60,
            'is_active'      => true,
        ]);

        CustomerPackage::create([
            'customer_id'        => $customerA->id,
            'package_id'         => $packageA->id,
            'workspace_id'       => $wsA->id,
            'remaining_sessions' => 3,
            'status'             => 'active',
        ]);

        CustomerPackage::create([
            'customer_id'        => $customerB->id,
            'package_id'         => $packageB->id,
            'workspace_id'       => $wsB->id,
            'remaining_sessions' => 3,
            'status'             => 'active',
        ]);

        $pkgsA = CustomerPackage::where('workspace_id', $wsA->id)->get();
        $pkgsB = CustomerPackage::where('workspace_id', $wsB->id)->get();

        $this->assertCount(1, $pkgsA);
        $this->assertCount(1, $pkgsB);
        $this->assertEquals($customerA->id, $pkgsA->first()->customer_id);
        $this->assertEquals($customerB->id, $pkgsB->first()->customer_id);
    }
}
