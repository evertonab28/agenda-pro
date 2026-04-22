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

    /** @test */
    public function it_rejects_payment_webhook_without_timestamp()
    {
        $workspace = Workspace::factory()->create();
        $workspace->integrations()->create([
            'type' => 'payment',
            'provider' => 'asaas',
            'credentials' => ['api_key' => 'fake_asaas_key'],
            'meta' => ['webhook_secret' => 'secret'],
        ]);

        $payload = [
            'event_id' => 'evt_missing_timestamp',
            'status' => 'paid',
            'id' => 'ext_missing_timestamp',
        ];

        $response = $this->postJson("/api/webhooks/{$workspace->slug}/asaas/payment", $payload);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_keeps_static_signature_fallback_for_payment_webhook_compatibility()
    {
        $workspace = Workspace::factory()->create();
        $workspace->integrations()->create([
            'type' => 'payment',
            'provider' => 'asaas',
            'credentials' => ['api_key' => 'fake_asaas_key'],
            'meta' => ['webhook_secret' => 'secret'],
        ]);

        $charge = Charge::factory()->create([
            'workspace_id' => $workspace->id,
            'payment_provider_id' => 'ext_static_signature',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders([
            'X-Webhook-Signature' => 'secret',
            'X-Webhook-Timestamp' => time(),
        ])->postJson("/api/webhooks/{$workspace->slug}/asaas/payment", [
            'event_id' => 'evt_static_signature',
            'status' => 'paid',
            'id' => 'ext_static_signature',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['action' => 'payment_recorded']);
        $this->assertEquals('paid', $charge->fresh()->status);
    }

    /** @test */
    public function payment_webhook_idempotency_is_scoped_by_workspace_provider_type_and_event_id()
    {
        $firstWorkspace = Workspace::factory()->create();
        $secondWorkspace = Workspace::factory()->create();

        foreach ([$firstWorkspace, $secondWorkspace] as $workspace) {
            $workspace->integrations()->create([
                'type' => 'payment',
                'provider' => 'asaas',
                'credentials' => ['api_key' => 'fake_asaas_key'],
                'meta' => ['webhook_secret' => 'secret'],
            ]);
        }

        $firstCharge = Charge::factory()->create([
            'workspace_id' => $firstWorkspace->id,
            'payment_provider_id' => 'ext_first',
            'status' => 'pending',
        ]);
        $secondCharge = Charge::factory()->create([
            'workspace_id' => $secondWorkspace->id,
            'payment_provider_id' => 'ext_second',
            'status' => 'pending',
        ]);

        $this->sendPaymentWebhook($firstWorkspace, [
            'event_id' => 'evt_shared',
            'status' => 'paid',
            'id' => 'ext_first',
        ])->assertStatus(200)->assertJson(['action' => 'payment_recorded']);

        $this->sendPaymentWebhook($secondWorkspace, [
            'event_id' => 'evt_shared',
            'status' => 'paid',
            'id' => 'ext_second',
        ])->assertStatus(200)->assertJson(['action' => 'payment_recorded']);

        $this->assertEquals('paid', $firstCharge->fresh()->status);
        $this->assertEquals('paid', $secondCharge->fresh()->status);
        $this->assertDatabaseCount('webhook_audits', 2);
        $this->assertDatabaseHas('webhook_audits', [
            'workspace_id' => $firstWorkspace->id,
            'provider' => 'asaas',
            'type' => 'payment',
            'event_id' => 'evt_shared',
        ]);
        $this->assertDatabaseHas('webhook_audits', [
            'workspace_id' => $secondWorkspace->id,
            'provider' => 'asaas',
            'type' => 'payment',
            'event_id' => 'evt_shared',
        ]);
    }

    private function sendPaymentWebhook(Workspace $workspace, array $payload)
    {
        $json = json_encode($payload);
        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $json, 'secret');

        return $this->call(
            'POST',
            "/api/webhooks/{$workspace->slug}/asaas/payment",
            [], [], [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_X_WEBHOOK_SIGNATURE' => $signature,
                'HTTP_X_WEBHOOK_TIMESTAMP' => $timestamp,
            ],
            $json
        );
    }
}
