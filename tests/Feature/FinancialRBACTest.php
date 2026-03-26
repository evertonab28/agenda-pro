<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Charge;
use App\Models\Clinic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialRBACTest extends TestCase
{
    use RefreshDatabase;

    protected $clinic;
    protected $admin;
    protected $manager;
    protected $operator;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->clinic = Clinic::factory()->create();
        
        $this->admin = User::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role' => 'admin'
        ]);

        $this->manager = User::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role' => 'manager'
        ]);

        $this->operator = User::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role' => 'operator'
        ]);

        $this->fulfillOnboarding($this->clinic->id);
    }

    public function test_admin_has_full_financial_access()
    {
        $charge = Charge::factory()->create(['clinic_id' => $this->clinic->id]);

        $this->actingAs($this->admin);
        
        $this->get(route('finance.charges.index'))->assertStatus(200);
        $this->get(route('finance.charges.show', $charge))->assertStatus(200);
        $this->post(route('finance.charges.store'), [
            'description' => 'Test',
            'amount' => 10,
            'due_date' => now()->format('Y-m-d')
        ])->assertRedirect();
        
        $this->delete(route('finance.charges.destroy', $charge))->assertRedirect();
    }

    public function test_operator_can_view_and_receive_but_not_delete()
    {
        $charge = Charge::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->actingAs($this->operator);

        // View - OK
        $this->get(route('finance.charges.index'))->assertStatus(200);
        $this->get(route('finance.charges.show', $charge))->assertStatus(200);

        // Receive - OK
        $this->post(route('finance.charges.receive', $charge), [
            'amount_received' => 10,
            'method' => 'pix'
        ])->assertRedirect();

        // Create - Restricted (Based on implementation_plan_sprint_3)
        // Note: Check if Policy actually allows Operator to create. 
        // Let's check ChargePolicy.
        $this->post(route('finance.charges.store'), [
            'description' => 'Not allowed',
            'amount' => 10
        ])->assertStatus(403);

        // Delete - Forbidden
        $this->delete(route('finance.charges.destroy', $charge))->assertStatus(403);
    }

    public function test_manager_has_broad_access()
    {
        $charge = Charge::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->actingAs($this->manager);

        $this->get(route('finance.charges.index'))->assertStatus(200);
        $this->post(route('finance.charges.store'), [
            'description' => 'Manager Test',
            'amount' => 50,
            'due_date' => now()->format('Y-m-d')
        ])->assertRedirect();
        
        $this->delete(route('finance.charges.destroy', $charge))->assertRedirect();
    }
}
