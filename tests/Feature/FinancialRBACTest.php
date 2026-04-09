<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Charge;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialRBACTest extends TestCase
{
    use RefreshDatabase;

    protected $workspace;
    protected $admin;
    protected $manager;
    protected $operator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::factory()->create();

        $this->admin = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'admin'
        ]);

        $this->manager = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'manager'
        ]);

        $this->operator = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'operator'
        ]);

        $this->fulfillOnboarding($this->workspace->id);
    }

    public function test_admin_has_full_financial_access()
    {
        $charge = Charge::factory()->create(['workspace_id' => $this->workspace->id]);

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
        $charge = Charge::factory()->create(['workspace_id' => $this->workspace->id]);
        $this->actingAs($this->operator);

        $this->get(route('finance.charges.index'))->assertStatus(200);
        $this->get(route('finance.charges.show', $charge))->assertStatus(200);

        $this->post(route('finance.charges.receive', $charge), [
            'amount_received' => 10,
            'method' => 'pix'
        ])->assertRedirect();

        $this->post(route('finance.charges.store'), [
            'description' => 'Not allowed',
            'amount' => 10
        ])->assertStatus(403);

        $this->delete(route('finance.charges.destroy', $charge))->assertStatus(403);
    }

    public function test_manager_has_broad_access()
    {
        $charge = Charge::factory()->create(['workspace_id' => $this->workspace->id]);
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
