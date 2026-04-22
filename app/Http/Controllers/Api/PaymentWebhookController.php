<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Services\IntegrationProviderFactory;
use App\Services\Integrations\WebhookIdempotencyService;
use App\Services\Integrations\WebhookVerifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function inbound(
        Request $request,
        Workspace $workspace,
        string $provider,
        WebhookVerifier $verifier,
        WebhookIdempotencyService $idempotencyService,
    ) {
        $payload = $request->getContent();

        $integration = $workspace->integrations()
            ->where('provider', $provider)
            ->where('type', 'payment')
            ->first();

        if (!$integration) {
            Log::warning('PaymentWebhook: integration not found', [
                'workspace' => $workspace->slug,
                'provider' => $provider,
            ]);

            return response()->json(['ok' => false, 'message' => 'Integration missing'], 404);
        }

        $verification = $verifier->verify(
            $request,
            $payload,
            $integration->meta['webhook_secret'] ?? '',
            $provider
        );

        if (!$verification->valid) {
            Log::warning('PaymentWebhook: signature rejected', [
                'workspace' => $workspace->slug,
                'provider' => $provider,
                'message' => $verification->message,
            ]);

            return response()->json(['ok' => false, 'message' => $verification->message], $verification->status);
        }

        $data = json_decode($payload, true) ?: [];
        $eventId = $data['event_id'] ?? $data['id'] ?? null;

        if (!$eventId) {
            return response()->json(['ok' => false, 'message' => 'event id ausente'], 422);
        }

        try {
            $result = $idempotencyService->handle(
                $workspace->id,
                $provider,
                'payment',
                (string) $eventId,
                function () use ($workspace, $data) {
                    return IntegrationProviderFactory::payment($workspace)->processCallback($data);
                }
            );
        } catch (\Exception $e) {
            Log::error('PaymentWebhook Error', ['message' => $e->getMessage()]);

            return response()->json(['ok' => false, 'message' => 'Process Failure'], 500);
        }

        if ($result === 'processed') {
            return response()->json(['ok' => true, 'action' => 'payment_recorded']);
        }

        return response()->json(['ok' => true, 'action' => $result]);
    }
}
