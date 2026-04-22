<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Workspace;
use App\Services\AppointmentLifecycleService;
use App\Services\Integrations\WebhookIdempotencyService;
use App\Services\Integrations\WebhookVerifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MessagingWebhookController extends Controller
{
    public function inbound(
        Request $request,
        Workspace $workspace,
        string $provider,
        WebhookVerifier $verifier,
        WebhookIdempotencyService $idempotencyService,
        AppointmentLifecycleService $lifecycleService,
    ) {
        $payload = $request->getContent();
        $integration = $workspace->integrations()
            ->where('provider', $provider)
            ->where('type', 'messaging')
            ->first();

        $verification = $verifier->verify(
            $request,
            $payload,
            $integration?->meta['webhook_secret'] ?? config('services.messaging.webhook_secret'),
            $provider
        );

        if (!$verification->valid) {
            Log::warning("MessagingWebhook: signature rejected ({$provider})", [
                'ip' => $request->ip(),
                'workspace' => $workspace->slug,
                'message' => $verification->message,
                'event_id' => json_decode($payload, true)['event_id'] ?? null,
            ]);

            return response()->json(['ok' => false, 'message' => $verification->message], $verification->status);
        }

        $data = json_decode($payload, true) ?: [];
        $eventId = $data['event_id'] ?? null;

        if (!$eventId) {
            return response()->json(['ok' => false, 'message' => 'event_id ausente'], 422);
        }

        $appointmentToken = $data['appointment_token'] ?? $data['token'] ?? null;

        if (!$appointmentToken) {
            return response()->json(['ok' => false, 'message' => 'Token do agendamento ausente'], 422);
        }

        $appointment = Appointment::withoutGlobalScopes()
            ->where('workspace_id', $workspace->id)
            ->where('public_token', $appointmentToken)
            ->first();

        if (!$appointment) {
            return response()->json(['ok' => false, 'message' => 'Agendamento não encontrado'], 404);
        }

        $text = mb_strtoupper(trim($data['text'] ?? ''));
        $action = 'ignored';

        try {
            $result = $idempotencyService->handle(
                $workspace->id,
                $provider,
                'messaging',
                (string) $eventId,
                function () use ($text, $appointment, $lifecycleService, &$action) {
                    if (str_contains($text, 'CONFIRMAR')) {
                        $lifecycleService->confirm($appointment);
                        $action = 'confirmed';

                        return true;
                    }

                    if (str_contains($text, 'REAGENDAR')) {
                        $lifecycleService->cancel($appointment);
                        $action = 'reschedule_requested';

                        return true;
                    }

                    return false;
                }
            );
        } catch (\Exception $e) {
            Log::error('MessagingWebhook Error', ['message' => $e->getMessage()]);

            return response()->json(['ok' => false, 'message' => 'Process Failure'], 500);
        }

        if ($result === 'already_processed') {
            return response()->json(['ok' => true, 'action' => 'already_processed']);
        }

        if ($result === 'ignored') {
            return response()->json(['ok' => true, 'action' => 'ignored']);
        }

        return response()->json(['ok' => true, 'action' => $action]);
    }
}
