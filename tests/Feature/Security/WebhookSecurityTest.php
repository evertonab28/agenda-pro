<?php

namespace Tests\Feature\Security;

use App\Models\Workspace;
use App\Models\Charge;
use App\Models\WebhookAudit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class WebhookSecurityTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_rejects_webhook_if_secret_is_missing_in_production()
    {
        // Simulate production environment
        $this->app['env'] = 'production';
        $workspace = Workspace::factory()->create();
        $workspace->integrations()->create([
            'type' => 'payment',
            'provider' => 'asaas',
            'credentials' => ['api_key' => 'fake_asaas_key'],
            'meta' => ['webhook_secret' => '']
        ]);
        
        $response = $this->postJson("/api/webhooks/{$workspace->slug}/asaas/payment", [
            'event_id' => 'evt_123',
            'status' => 'paid',
            'id' => 'ext_123'
        ]);

        $response->assertStatus(401);
        $response->assertJson(['message' => 'Unauthorized signature']);
        
        // Reset env
        $this->app['env'] = 'testing';
    }

    /** @test */
    public function it_processes_webhook_idempotently()
    {
        Config::set('services.messaging.webhook_secret', 'secret');
        $workspace = Workspace::factory()->create();
        $charge = Charge::factory()->create([
            'workspace_id' => $workspace->id,
            'payment_provider_id' => 'ext_abc123',
            'status' => 'pending'
        ]);

        $workspace->integrations()->create([
            'type' => 'payment',
            'provider' => 'asaas',
            'credentials' => ['api_key' => 'fake_asaas_key'],
            'meta' => ['webhook_secret' => 'secret']
        ]);

        $payload = json_encode([
            'event_id' => 'evt_999',
            'status' => 'paid',
            'id' => 'ext_abc123'
        ]);

        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $payload, 'secret');

        // Primeira requisição - deve processar
        $response = $this->call(
            'POST',
            "/api/webhooks/{$workspace->slug}/asaas/payment",
            [], [], [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_WEBHOOK_SIGNATURE' => $signature,
                'HTTP_X_WEBHOOK_TIMESTAMP' => $timestamp,
            ],
            $payload
        );

        $response->assertStatus(200);
        $this->assertEquals('paid', $charge->fresh()->status);
        $this->assertDatabaseHas('webhook_audits', ['event_id' => 'evt_999']);

        // Segunda requisição - deve ser idempotente
        $response2 = $this->call(
            'POST',
            "/api/webhooks/{$workspace->slug}/asaas/payment",
            [], [], [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_WEBHOOK_SIGNATURE' => $signature,
                'HTTP_X_WEBHOOK_TIMESTAMP' => $timestamp,
            ],
            $payload
        );
        $response2->assertStatus(200);
        $response2->assertJson(['action' => 'already_processed']);
    }
}
