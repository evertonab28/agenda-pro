<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Charge;
use App\Models\Customer;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Carbon;

class FinanceChargeTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $operator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->admin = User::factory()->create(['workspace_id' => $this->workspace->id, 'role' => 'admin']);
        $this->operator = User::factory()->create(['workspace_id' => $this->workspace->id, 'role' => 'operator']);
        $this->fulfillOnboarding($this->workspace->id);
    }

    public function test_can_view_finance_dashboard()
    {
        $response = $this->actingAs($this->admin)->get(route('finance.dashboard'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Finance/Dashboard'));
    }

    public function test_can_list_charges()
    {
        Charge::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'pending',
            'due_date' => Carbon::now()->addDays(5)
        ]);

        $response = $this->actingAs($this->admin)->get(route('finance.charges.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Finance/Charges/Index')
            ->has('charges.data', 3)
        );
    }

    public function test_admin_can_create_charge()
    {
        $this->withoutExceptionHandling();
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

        $data = [
            'description' => 'Test Charge',
            'customer_id' => $customer->id,
            'amount' => '150.00',
            'due_date' => Carbon::now()->addDays(10)->format('Y-m-d'),
            'payment_method' => 'pix',
            'notes' => 'Some notes'
        ];

        $response = $this->actingAs($this->admin)->post(route('finance.charges.store'), $data);

        $response->assertRedirect(route('finance.charges.index'));
        $this->assertDatabaseHas('charges', [
            'description' => 'Test Charge',
            'amount' => '150.00',
            'status' => 'pending',
        ]);
    }

    public function test_operator_cannot_create_charge()
    {
        $data = [
            'description' => 'Test Charge',
            'amount' => '150.00',
            'due_date' => Carbon::now()->addDays(10)->format('Y-m-d'),
        ];

        $response = $this->actingAs($this->operator)->post(route('finance.charges.store'), $data);

        $response->assertStatus(403);
    }

    public function test_admin_can_cancel_charge()
    {
        $charge = Charge::factory()->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->admin)
            ->from(route('finance.charges.index'))
            ->delete(route('finance.charges.destroy', $charge));

        $response->assertRedirect(route('finance.charges.index'));
        $charge->update(['status' => 'canceled']);
        $this->assertEquals('canceled', $charge->fresh()->status);
    }
}
