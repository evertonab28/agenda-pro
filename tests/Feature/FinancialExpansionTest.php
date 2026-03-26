<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Package;
use App\Models\Service;
use App\Models\User;
use App\Models\Clinic;
use App\Services\PackageService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialExpansionTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $customer;
    protected $service;
    protected $clinic;

    protected function setUp(): void
    {
        parent::setUp();
        $this->clinic = Clinic::factory()->create();
        $this->user = User::factory()->create(['clinic_id' => $this->clinic->id, 'role' => 'admin']);
        $this->fulfillOnboarding($this->clinic->id);
        
        $this->customer = Customer::create([
            'clinic_id' => $this->clinic->id,
            'name' => 'John Doe',
            'phone' => '11999999999',
            'email' => 'john@example.com'
        ]);
        
        $this->service = Service::create([
            'clinic_id' => $this->clinic->id,
            'name' => 'Corte de Cabelo',
            'price' => 50.00,
            'duration_minutes' => 30,
            'is_active' => true
        ]);
    }

    public function test_customer_wallet_can_be_credited_and_debited()
    {
        $walletService = new WalletService();
        
        // Credit
        $walletService->credit($this->customer, 100.00, 'Saldo inicial');
        $this->assertEquals(100.00, $this->customer->wallet->balance);

        // Debit
        $walletService->debit($this->customer, 40.00, 'Pagamento serviço');
        $this->assertEquals(60.00, $this->customer->refresh()->wallet->balance);
    }

    public function test_package_sale_creates_sessions_and_charge()
    {
        $package = Package::create([
            'clinic_id' => $this->clinic->id,
            'name' => 'Combo 5 Cortes',
            'service_id' => $this->service->id,
            'sessions_count' => 5,
            'price' => 200.00,
            'validity_days' => 90
        ]);

        $packageService = new PackageService();
        $customerPackage = $packageService->sellPackage($this->customer, $package);

        $this->assertEquals(5, $customerPackage->remaining_sessions);
        $this->assertDatabaseHas('charges', [
            'clinic_id' => $this->clinic->id, // Added clinic_id check
            'customer_id' => $this->customer->id,
            'amount' => 200.00,
            'reference_type' => 'customer_package',
            'reference_id' => $customerPackage->id
        ]);
    }

    public function test_wallet_debit_fails_on_insufficient_funds()
    {
        $walletService = new WalletService();
        $this->expectException(\Exception::class);
        $walletService->debit($this->customer, 10.00, 'Teste falha');
    }
}
