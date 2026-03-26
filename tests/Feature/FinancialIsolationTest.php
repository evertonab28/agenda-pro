<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Charge;
use App\Models\Clinic;
use App\Models\Customer;
use App\Models\Receipt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected $clinicA;
    protected $clinicB;
    protected $adminA;
    protected $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA = Clinic::factory()->create(['name' => 'Clinic A']);
        $this->clinicB = Clinic::factory()->create(['name' => 'Clinic B']);

        $this->adminA = User::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'role' => 'admin'
        ]);

        $this->adminB = User::factory()->create([
            'clinic_id' => $this->clinicB->id,
            'role' => 'admin'
        ]);

        $this->fulfillOnboarding($this->clinicA->id);
        $this->fulfillOnboarding($this->clinicB->id);
    }

    public function test_user_cannot_view_charge_of_another_clinic_directly()
    {
        // Charge belonging to Clinic B
        $chargeB = Charge::factory()->create([
            'clinic_id' => $this->clinicB->id
        ]);

        // Admin A tries to view Charge B
        $response = $this->actingAs($this->adminA)
            ->get(route('finance.charges.show', $chargeB));

        // Should return 404 because TenantScope filters it out from the query
        $response->assertStatus(404);
    }

    public function test_user_cannot_see_charges_of_another_clinic_in_list()
    {
        // 2 charges for A, 3 for B
        Charge::factory()->count(2)->create(['clinic_id' => $this->clinicA->id]);
        Charge::factory()->count(3)->create(['clinic_id' => $this->clinicB->id]);

        $response = $this->actingAs($this->adminA)
            ->get(route('finance.charges.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('charges.data', 2) // Only Clinic A's charges
        );
    }

    public function test_user_cannot_update_charge_of_another_clinic()
    {
        $chargeB = Charge::factory()->create(['clinic_id' => $this->clinicB->id]);

        $response = $this->actingAs($this->adminA)
            ->put(route('finance.charges.update', $chargeB), [
                'amount' => 999.99
            ]);

        $response->assertStatus(404);
        $this->assertDatabaseMissing('charges', [
            'id' => $chargeB->id,
            'amount' => 999.99
        ]);
    }

    public function test_user_cannot_register_payment_for_charge_of_another_clinic()
    {
        $chargeB = Charge::factory()->create(['clinic_id' => $this->clinicB->id, 'amount' => 100]);

        $response = $this->actingAs($this->adminA)
            ->post(route('finance.charges.receive', $chargeB), [
                'amount_received' => 100,
                'method' => 'pix'
            ]);

        $response->assertStatus(404);
        $this->assertDatabaseCount('receipts', 0);
    }

    public function test_receipts_are_strictly_isolated_by_tenant()
    {
        $chargeA = Charge::factory()->create(['clinic_id' => $this->clinicA->id]);
        $chargeB = Charge::factory()->create(['clinic_id' => $this->clinicB->id]);

        // Create receipt for A
        Receipt::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'charge_id' => $chargeA->id,
            'amount_received' => 50,
        ]);

        // Create receipt for B
        Receipt::factory()->create([
            'clinic_id' => $this->clinicB->id,
            'charge_id' => $chargeB->id,
            'amount_received' => 70,
        ]);

        $this->actingAs($this->adminA);
        $this->assertEquals(1, Receipt::count()); // TenantScope should filter B
    }
}
