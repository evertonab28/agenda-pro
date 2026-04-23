<?php

namespace Tests\Feature;

use App\Models\Professional;
use App\Models\Workspace;
use App\Models\User;
use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionGatingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(\Database\Seeders\PlanSeeder::class);

        // Criar workspace base
        $this->workspace = Workspace::create(['name' => 'Base Workspace', 'slug' => 'base-ws']);
        $this->user = User::factory()->create(['workspace_id' => $this->workspace->id, 'role' => 'admin']);

        // Satisfazer CheckOnboarding middleware
        \App\Models\Setting::create(['key' => 'company_name', 'value' => 'Test Co', 'workspace_id' => $this->workspace->id]);
        $service = \App\Models\Service::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Test Service', 
            'price' => 100, 
            'duration_minutes' => 30
        ]);
        $prof = \App\Models\Professional::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Test Prof', 
            'email' => 'test@prof.com'
        ]);
        \App\Models\ProfessionalSchedule::create([
            'workspace_id' => $this->workspace->id,
            'professional_id' => $prof->id,
            'weekday' => 1,
            'start_time' => '09:00',
            'end_time' => '17:00'
        ]);
    }

    public function test_workspace_starts_in_trial_after_creation()
    {
        $workspace = Workspace::create(['name' => 'Test Workspace', 'slug' => 'test-ws']);
        
        $this->assertDatabaseHas('workspace_subscriptions', [
            'workspace_id' => $workspace->id,
            'status' => 'trialing'
        ]);
        
        $workspace->refresh();
        $this->assertTrue($workspace->subscription->isActive());
    }

    public function test_cannot_access_crm_if_plan_does_not_permit()
    {
        $plan = Plan::where('slug', 'starter')->first();
        
        // O $this->workspace já possui assinatura Starter via Observer
        $this->workspace->subscription->update(['plan_id' => $plan->id, 'status' => 'active']);

        $response = $this->actingAs($this->user)->get('/crm');
        
        $response->assertStatus(302);
        $response->assertLocation('http://localhost/configuracoes/assinatura');
    }

    public function test_can_access_crm_if_plan_permits()
    {
        $plan = Plan::where('slug', 'pro')->first();
        
        $this->workspace->subscription->update(['plan_id' => $plan->id, 'status' => 'active']);

        $response = $this->actingAs($this->user)->get('/crm');
        
        $response->assertStatus(200);
    }

    public function test_cannot_create_professional_beyond_plan_limit()
    {
        $plan = Plan::where('slug', 'starter')->first(); // Limit: 1
        $workspace = Workspace::create(['name' => 'Limit WS', 'slug' => 'limit-ws']);
        $user = User::factory()->create(['workspace_id' => $workspace->id, 'role' => 'admin']);
        
        $workspace->subscription->update(['plan_id' => $plan->id, 'status' => 'active']);

        // Criar serviço e profissional para o workspace de limite
        $service = \App\Models\Service::create([
            'workspace_id' => $workspace->id,
            'name' => 'Serviço Limite',
            'price' => 50,
            'duration_minutes' => 30,
        ]);
        Professional::create(['workspace_id' => $workspace->id, 'name' => 'Prof 1', 'email' => 'p1@test.com']);

        // Tentar criar o segundo (services obrigatório na validação)
        $response = $this->actingAs($user)->post(route('configuracoes.professionals.store'), [
            'name' => 'Prof 2',
            'email' => 'p2@test.com',
            'is_active' => true,
            'services' => [$service->id],
        ]);

        $response->assertSessionHas('error', 'Limite de profissionais atingido para seu plano atual. Faça um upgrade!');
        $this->assertEquals(1, Professional::where('workspace_id', $workspace->id)->count());
    }

    public function test_trial_expiration_blocks_core_actions()
    {
        $workspace = Workspace::create(['name' => 'Expired WS', 'slug' => 'expired-ws']);
        $user = User::factory()->create(['workspace_id' => $workspace->id, 'role' => 'admin']);
        
        // Expirar trial
        $workspace->subscription->update([
            'status' => 'trialing',
            'trial_ends_at' => now()->subDay()
        ]);
        
        $workspace->refresh();

        // Tentar acessar agenda (rota bloqueada pela middleware de assinatura)
        $response = $this->actingAs($user)->get('/agenda');
        $response->assertRedirect(route('configuracoes.billing.index'));
    }
}
