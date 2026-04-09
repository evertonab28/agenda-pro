<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Charge;
use App\Models\Workspace;
use App\Models\Customer;
use App\Models\Receipt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected $workspaceA;
    protected $workspaceB;
    protected $adminA;
    protected $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspaceA = Workspace::factory()->create(['name' => 'Workspace A']);
        $this->workspaceB = Workspace::factory()->create(['name' => 'Workspace B']);

        $this->adminA = User::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'role' => 'admin'
        ]);

        $this->adminB = User::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'role' => 'admin'
        ]);

        $this->fulfillOnboarding($this->workspaceA->id);
        $this->fulfillOnboarding($this->workspaceB->id);
    }

    public function test_user_cannot_view_charge_of_another_workspace_directly()
    {
        $chargeB = Charge::factory()->create([
            'workspace_id' => $this->workspaceB->id
        ]);

        $response = $this->actingAs($this->adminA)
            ->get(route('finance.charges.show', $chargeB));

        $response->assertStatus(404);
    }

    public function test_user_cannot_see_charges_of_another_workspace_in_list()
    {
        Charge::factory()->count(2)->create(['workspace_id' => $this->workspaceA->id]);
        Charge::factory()->count(3)->create(['workspace_id' => $this->workspaceB->id]);

        $response = $this->actingAs($this->adminA)
            ->get(route('finance.charges.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('charges.data', 2)
        );
    }

    public function test_user_cannot_update_charge_of_another_workspace()
    {
        $chargeB = Charge::factory()->create(['workspace_id' => $this->workspaceB->id]);

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

    public function test_user_cannot_register_payment_for_charge_of_another_workspace()
    {
        $chargeB = Charge::factory()->create(['workspace_id' => $this->workspaceB->id, 'amount' => 100]);

        $response = $this->actingAs($this->adminA)
            ->post(route('finance.charges.receive', $chargeB), [
                'amount_received' => 100,
                'method' => 'pix'
            ]);

        $response->assertStatus(404);
        $this->assertDatabaseCount('receipts', 0);
    }

    public function test_receipts_are_strictly_isolated_by_workspace()
    {
        $chargeA = Charge::factory()->create(['workspace_id' => $this->workspaceA->id]);
        $chargeB = Charge::factory()->create(['workspace_id' => $this->workspaceB->id]);

        Receipt::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'charge_id' => $chargeA->id,
            'amount_received' => 50,
        ]);

        Receipt::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'charge_id' => $chargeB->id,
            'amount_received' => 70,
        ]);

        $this->actingAs($this->adminA);
        $this->assertEquals(1, Receipt::count()); // TenantScope should filter B
    }
}
