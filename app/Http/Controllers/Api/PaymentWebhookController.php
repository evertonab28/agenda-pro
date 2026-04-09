<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\WebhookAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function inbound(Request $request, Workspace $workspace, string $provider)
    {
        $payload = $request->getContent();
        
        $integration = $workspace->integrations()->where('provider', $provider)->where('type', 'payment')->first();
        
        if (!$integration) {
            Log::warning("PaymentWebhook: Integration not found", ['workspace' => $workspace->slug, 'provider' => $provider]);
            return response()->json(['ok' => false, 'message' => 'Integration missing'], 404);
        }

        $secret = $integration->meta['webhook_secret'] ?? '';

        // Validação da assinatura específica do Asaas (ex: X-Webhook-Signature ou asaas-signature)
        $signature = $request->header('X-Webhook-Signature', $request->header('asaas-signature'));
        
        if (empty($secret)) {
            Log::error("PaymentWebhook: Webhook secret not configured", ['workspace' => $workspace->slug]);
            return response()->json(['ok' => false, 'message' => 'Unauthorized signature'], 401);
        }

        $timestamp = $request->header('X-Webhook-Timestamp', now()->timestamp);
        $expectedSignature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
        $isValid = hash_equals($expectedSignature, (string)$signature);

        if (!$isValid && $signature !== $secret) {
            return response()->json(['ok' => false, 'message' => 'Unauthorized signature'], 401);
        }

        $data = json_decode($payload, true);
        $eventId = $data['event_id'] ?? $data['id'] ?? null;

        if (!$eventId) {
            return response()->json(['ok' => false, 'message' => 'event id ausente'], 422);
        }

        // Idempotência
        $alreadyProcessed = WebhookAudit::where('provider', $provider)
            ->where('event_id', $eventId)
            ->exists();

        if ($alreadyProcessed) {
            return response()->json(['ok' => true, 'action' => 'already_processed']);
        }

        try {
            $paymentService = \App\Services\IntegrationProviderFactory::payment($workspace);
            $processed = $paymentService->processCallback($data);

            if ($processed) {
                WebhookAudit::create(['provider' => $provider, 'event_id' => $eventId]);
                return response()->json(['ok' => true, 'action' => 'payment_recorded']);
            }

            return response()->json(['ok' => true, 'action' => 'ignored']);
        } catch (\Exception $e) {
            Log::error("PaymentWebhook Error", ['message' => $e->getMessage()]);
            return response()->json(['ok' => false, 'message' => 'Process Failure'], 500);
        }
    }
}
