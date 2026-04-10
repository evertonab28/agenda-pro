<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceSubscription;
use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformReadLayerTest extends TestCase
{
    use RefreshDatabase;

    protected \App\Models\AdminUser $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = \App\Models\AdminUser::create([
            'name'     => 'Admin User',
            'email'    => 'admin@agendapro.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);
    }

    public function test_admin_can_see_cancellations_from_other_workspaces()
    {
        $otherWorkspace = Workspace::factory()->create(['name' => 'Other Corp']);
        $subscription = WorkspaceSubscription::factory()->create([
            'workspace_id' => $otherWorkspace->id,
            'canceled_at' => now(),
            'cancellation_category' => 'Price',
            'cancellation_reason' => 'Too expensive'
        ]);

        $response = $this->actingAs($this->admin, 'admin')->get(route('admin.dashboard'));

        $response->assertStatus(200);
        $response->assertSee('Other Corp');
        $response->assertSee('Price');
    }

    public function test_admin_can_view_workspace_list_with_counts()
    {
        $otherWorkspace = Workspace::factory()->create(['name' => 'Tenant A']);
        
        // Add some data to Tenant A
        User::factory()->count(3)->create(['workspace_id' => $otherWorkspace->id]);
        \App\Models\Customer::factory()->count(5)->create(['workspace_id' => $otherWorkspace->id]);
        
        Plan::create(['name' => 'Pro', 'slug' => 'pro', 'price' => 100, 'billing_cycle' => 'monthly', 'is_active' => true, 'features' => []]);

        $response = $this->actingAs($this->admin, 'admin')->get(route('admin.workspaces.index'));

        $response->assertStatus(200);
        $response->assertSee('Tenant A');
        $response->assertSee('Pro');
        
        // Final verification that counts are present in the response content (as JSON)
        $response->assertSee('"users_count":3');
        $response->assertSee('"customers_count":5');
    }

    public function test_non_admin_cannot_access_platform_read_layer_routes()
    {
        $regularUser = User::factory()->create(['role' => 'professional']);
        
        $response = $this->actingAs($regularUser)->get(route('admin.dashboard'));
        
        // Should be forbidden or redirected
        $this->assertTrue($response->status() >= 300); 
    }
}
