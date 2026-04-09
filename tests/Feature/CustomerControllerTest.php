<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Customer;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\Workspace;
use App\Models\Charge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->user = User::factory()->create(['workspace_id' => $this->workspace->id, 'role' => 'admin']);
        $this->fulfillOnboarding($this->workspace->id);
    }

    public function test_can_list_customers()
    {
        Customer::factory()->count(3)->create(['workspace_id' => $this->workspace->id]);

        $response = $this->actingAs($this->user)
            ->get(route('customers.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Customers/Index')
            ->has('customers.data', 3)
        );
    }

    public function test_can_filter_customers_by_search()
    {
        Customer::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'John Doe']);
        Customer::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'Jane Smith']);

        $response = $this->actingAs($this->user)
            ->get(route('customers.index', ['search' => 'John']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('customers.data', 1)
            ->where('customers.data.0.name', 'John Doe')
        );
    }

    public function test_can_create_customer()
    {
        $this->withoutExceptionHandling();
        $data = [
            'name' => 'New Customer',
            'phone' => '11999999999',
            'email' => 'new@example.com',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('customers.store'), $data);

        $response->assertRedirect(route('customers.index'));
        $this->assertDatabaseHas('customers', [
            'name' => 'New Customer',
            'phone' => '11999999999',
        ]);
    }

    public function test_can_update_customer()
    {
        $this->withoutExceptionHandling();
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'Old Name']);

        $response = $this->actingAs($this->user)
            ->put(route('customers.update', $customer), [
                'name' => 'Updated Name',
                'phone' => '11888888888',
                'is_active' => true,
            ]);

        $response->assertRedirect(route('customers.show', $customer));
        $this->assertEquals('Updated Name', $customer->fresh()->name);
    }

    public function test_can_toggle_customer_status()
    {
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id, 'is_active' => true]);

        $response = $this->actingAs($this->user)
            ->from(route('customers.show', $customer))
            ->patch(route('customers.status', $customer));

        $response->assertStatus(302);
        $response->assertRedirect(route('customers.show', $customer));
        $this->assertFalse($customer->fresh()->is_active);
    }

    public function test_cannot_delete_customer_with_appointments()
    {
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        $prof = \App\Models\Professional::factory()->create(['workspace_id' => $this->workspace->id]);
        $svc = Service::factory()->create(['workspace_id' => $this->workspace->id]);

        Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'customer_id' => $customer->id,
            'professional_id' => $prof->id,
            'service_id' => $svc->id,
        ]);

        $response = $this->actingAs($this->user)
            ->from(route('customers.show', $customer))
            ->delete(route('customers.destroy', $customer));

        $response->assertStatus(302);
        $response->assertRedirect(route('customers.show', $customer));
        $this->assertDatabaseHas('customers', ['id' => $customer->id]);
    }
}
