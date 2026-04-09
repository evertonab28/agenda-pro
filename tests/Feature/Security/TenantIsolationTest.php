<?php

namespace Tests\Feature\Security;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Charge;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_automatically_scopes_queries_by_tenant()
    {
        // 1. Criar Workspace A e Workspace B
        $workspaceA = Workspace::create(['name' => 'Workspace A', 'slug' => 'workspace-a']);
        $workspaceB = Workspace::create(['name' => 'Workspace B', 'slug' => 'workspace-b']);

        // 2. Criar Admin no Workspace A
        $adminA = User::factory()->create(['workspace_id' => $workspaceA->id]);

        // 3. Criar Dados em ambos
        Charge::factory()->create(['workspace_id' => $workspaceA->id, 'amount' => 100]);
        Charge::factory()->create(['workspace_id' => $workspaceB->id, 'amount' => 200]);

        // 4. Agir como Admin A
        $this->actingAs($adminA);

        // 5. Verificar que só vê dados do Workspace A
        $this->assertEquals(1, Charge::count());
        $this->assertEquals(100, Charge::first()->amount);
    }

    /** @test */
    public function it_prevents_unauthorized_access_to_other_tenant_resource()
    {
        $workspaceA = Workspace::create(['name' => 'Workspace A', 'slug' => 'workspace-a']);
        $workspaceB = Workspace::create(['name' => 'Workspace B', 'slug' => 'workspace-b']);

        $adminA = User::factory()->create(['workspace_id' => $workspaceA->id]);
        $chargeB = Charge::factory()->create(['workspace_id' => $workspaceB->id]);

        $this->actingAs($adminA);

        // O GlobalScope vai fazer retornar 404 se não achar no scope
        $response = $this->getJson("/api/charges/{$chargeB->id}");

        $response->assertStatus(404); // Scoped out
    }
}
