<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceIntegration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $workspace;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'admin',
        ]);
    }

    /** @test */
    public function it_lists_workspace_integrations()
    {
        WorkspaceIntegration::create([
            'workspace_id' => $this->workspace->id,
            'type' => 'payment',
            'provider' => 'asaas',
            'credentials' => ['api_key' => '123'],
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/workspace-integrations');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['provider' => 'asaas']);
        
        // Assert credentials are NOT exposed in index
        $this->assertArrayNotHasKey('credentials', $response->json()[0]);
    }

    /** @test */
    public function it_stores_a_valid_integration()
    {
        $payload = [
            'type' => 'messaging',
            'provider' => 'evolution',
            'credentials' => [
                'api_key' => '12345',
                'instance_name' => 'whatsapp_1',
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/workspace-integrations', $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspace_integrations', [
            'workspace_id' => $this->workspace->id,
            'type' => 'messaging',
            'provider' => 'evolution',
        ]);
        
        // As credentials are cast to encrypted array, asserting raw DB usually fails on exact string match, we can assert structure
    }

    /** @test */
    public function it_rejects_invalid_providers()
    {
        $payload = [
            'type' => 'payment',
            'provider' => 'evolution', // Invalid for payment
            'credentials' => [
                'api_key' => '12345',
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/workspace-integrations', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['provider']);
    }

    /** @test */
    public function it_tests_connection_invalid()
    {
        $integration = WorkspaceIntegration::create([
            'workspace_id' => $this->workspace->id,
            'type' => 'payment',
            'provider' => 'asaas',
            'credentials' => ['api_key' => ''], // Invalid credential triggers exception in factory/service throw
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/workspace-integrations/{$integration->id}/test-connection");

        $response->assertStatus(400); // Bad Request because Exception is thrown in Controller
        
        $integration->refresh();
        $this->assertEquals('error', $integration->status);
    }
}
