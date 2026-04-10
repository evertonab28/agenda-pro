<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Appointment;
use App\Models\WebhookAudit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class WebhookHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected $workspace;
    protected $appointment;

    // Use a non-evolution provider so signature validation is enforced
    protected string $provider = 'whatsapp';

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.messaging.webhook_secret', 'secret-val-123');

        $this->workspace = Workspace::factory()->create(['slug' => 'test-workspace']);
        $this->appointment = Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'public_token' => 'valid-token-123'
        ]);
    }

    protected function webhookUrl(?string $provider = null): string
    {
        $p = $provider ?? $this->provider;
        return "/api/webhooks/{$this->workspace->slug}/{$p}/messaging";
    }

    protected function getSignature($timestamp, $payload, $secret)
    {
        return hash_hmac('sha256', $timestamp . '.' . json_encode($payload), $secret);
    }

    /** @test */
    public function it_returns_401_when_signature_is_missing()
    {
        $response = $this->postJson($this->webhookUrl(), [
            'event_id' => 'evt_001',
            'text' => 'CONFIRMAR',
            'token' => 'some-appt-token'
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_returns_401_when_signature_is_invalid()
    {
        $timestamp = time();
        $payload = ['event_id' => 'evt_001', 'text' => 'C', 'token' => 'T'];

        $response = $this->withHeaders([
                'X-Webhook-Signature' => 'invalid-sig',
                'X-Webhook-Timestamp' => $timestamp,
            ])
            ->postJson($this->webhookUrl(), $payload);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_returns_401_when_timestamp_is_too_old()
    {
        $secret = 'secret-val-123';
        $timestamp = time() - 600; // 10 min atras
        $payload = ['event_id' => 'evt_001', 'text' => 'C', 'token' => 'T'];
        $signature = $this->getSignature($timestamp, $payload, $secret);

        $response = $this->withHeaders([
                'X-Webhook-Signature' => $signature,
                'X-Webhook-Timestamp' => $timestamp,
            ])
            ->postJson($this->webhookUrl(), $payload);

        $response->assertStatus(401);
        $this->assertEquals('Request expirado (Timestamp drift)', $response->json('message'));
    }

    /** @test */
    public function it_blocks_duplicate_event_id_idempotency()
    {
        // Use evolution provider which bypasses signature validation for simplicity
        $provider = 'evolution';
        $timestamp = time();
        $payload = ['event_id' => 'evt_unique_1', 'text' => 'CONFIRMAR', 'token' => 'valid-token-123'];

        // Primeira vez - sucesso
        $res1 = $this->withHeaders([
                'X-Webhook-Timestamp' => $timestamp,
            ])
            ->postJson($this->webhookUrl($provider), $payload);

        $res1->assertStatus(200);
        $this->assertEquals('confirmed', $res1->json('action'));

        // Segunda vez com mesmo event_id - deve retornar already_processed
        $response = $this->withHeaders([
                'X-Webhook-Timestamp' => $timestamp,
            ])
            ->postJson($this->webhookUrl($provider), $payload);

        $response->assertStatus(200);
        $this->assertEquals('already_processed', $response->json('action'));
    }

    /** @test */
    public function it_throttles_excessive_requests()
    {
        $secret = 'secret-val-123';
        $timestamp = time();

        // Throttle is 20/min: send 20 requests then the 21st should be throttled
        for ($i = 0; $i < 20; $i++) {
            $payload = ['event_id' => 'evt_'.$i, 'text' => 'T', 'token' => 'K'];
            $this->withHeaders([
                'X-Webhook-Signature' => $this->getSignature($timestamp, $payload, $secret),
                'X-Webhook-Timestamp' => $timestamp,
            ])->postJson($this->webhookUrl(), $payload);
        }

        $payload = ['event_id' => 'evt_21', 'text' => 'T', 'token' => 'K'];
        $response = $this->withHeaders([
                'X-Webhook-Signature' => $this->getSignature($timestamp, $payload, $secret),
                'X-Webhook-Timestamp' => $timestamp,
            ])->postJson($this->webhookUrl(), $payload);

        $response->assertStatus(429);
    }
}
