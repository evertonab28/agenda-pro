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
        Config::set('services.messaging.webhook_secret', '');

        $response = $this->postJson('/api/webhooks/messaging/inbound', [
            'event_id' => 'evt_123',
            'status' => 'paid',
            'id' => 'ext_123'
        ]);

        $response->assertStatus(500);
        $response->assertJson(['message' => 'Configuração segura ausente']);
        
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

        $payload = json_encode([
            'event_id' => 'evt_999',
            'status' => 'paid',
            'id' => 'ext_abc123'
        ]);

        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $payload, 'secret');

        // Primeir requisição - deve processar
        $response = $this->postJson('/api/webhooks/messaging/inbound', json_decode($payload, true), [
            'X-Webhook-Signature' => $signature,
            'X-Webhook-Timestamp' => $timestamp
        ]);

        $response->assertStatus(200);
        $this->assertEquals('paid', $charge->fresh()->status);
        $this->assertDatabaseHas('webhook_audits', ['event_id' => 'evt_999']);

        // Segunda requisição - deve ser idempotente
        $response2 = $this->postJson('/api/webhooks/messaging/inbound', json_decode($payload, true), [
            'X-Webhook-Signature' => $signature,
            'X-Webhook-Timestamp' => $timestamp
        ]);

        $response2->assertStatus(200);
        $response2->assertJson(['action' => 'already_processed']);
    }
}
