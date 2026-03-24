<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Clinic;
use App\Models\Appointment;
use App\Models\WebhookAudit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class WebhookHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected $clinic;
    protected $appointment;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.messaging.webhook_secret', 'secret-val-123');
        
        $this->clinic = Clinic::factory()->create();
        $this->appointment = Appointment::factory()->create([
            'clinic_id' => $this->clinic->id,
            'public_token' => 'valid-token-123'
        ]);
    }

    protected function getSignature($timestamp, $payload, $secret)
    {
        return hash_hmac('sha256', $timestamp . '.' . json_encode($payload), $secret);
    }

    /** @test */
    public function it_returns_401_when_signature_is_missing()
    {
        $response = $this->postJson('/api/webhooks/messaging/inbound', [
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
            ->postJson('/api/webhooks/messaging/inbound', $payload);

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
            ->postJson('/api/webhooks/messaging/inbound', $payload);

        $response->assertStatus(401);
        $this->assertEquals('Request expirado (Timestamp drift)', $response->json('message'));
    }

    /** @test */
    public function it_blocks_duplicate_event_id_idempotency()
    {
        $secret = 'secret-val-123';
        $timestamp = time();
        $payload = ['event_id' => 'evt_unique_1', 'text' => 'CONFIRMAR', 'token' => 'valid-token-123'];
        $signature = $this->getSignature($timestamp, $payload, $secret);

        // Primeira vez - sucesso
        $res1 = $this->withHeaders([
                'X-Webhook-Signature' => $signature,
                'X-Webhook-Timestamp' => $timestamp,
            ])
            ->postJson('/api/webhooks/messaging/inbound', $payload);
        
        $res1->assertStatus(200);

        // Segunda vez - deve retornar already_processed
        $response = $this->withHeaders([
                'X-Webhook-Signature' => $signature,
                'X-Webhook-Timestamp' => $timestamp,
            ])
            ->postJson('/api/webhooks/messaging/inbound', $payload);

        $response->assertStatus(200);
        $this->assertEquals('already_processed', $response->json('action'));
    }

    /** @test */
    public function it_throttles_excessive_requests()
    {
        $secret = 'secret-val-123';
        $timestamp = time();
        
        for ($i = 0; $i < 6; $i++) {
            $payload = ['event_id' => 'evt_'.$i, 'text' => 'T', 'token' => 'K'];
            $this->withHeaders([
                'X-Webhook-Signature' => $this->getSignature($timestamp, $payload, $secret),
                'X-Webhook-Timestamp' => $timestamp,
            ])->postJson('/api/webhooks/messaging/inbound', $payload);
        }

        $payload = ['event_id' => 'evt_7', 'text' => 'T', 'token' => 'K'];
        $response = $this->withHeaders([
                'X-Webhook-Signature' => $this->getSignature($timestamp, $payload, $secret),
                'X-Webhook-Timestamp' => $timestamp,
            ])->postJson('/api/webhooks/messaging/inbound', $payload);

        $response->assertStatus(429);
    }
}
