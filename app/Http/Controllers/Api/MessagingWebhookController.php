<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\WebhookAudit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MessagingWebhookController extends Controller
{
    public function inbound(Request $request, \App\Models\Workspace $workspace, string $provider)
    {
        $signature = $request->header('X-Webhook-Signature', $request->header('asaas-signature'));
        $timestamp = $request->header('X-Webhook-Timestamp', now()->timestamp);
        $payload = $request->getContent();
        // Determine actual verification secret based on Provider
        $secret = '';
        if ($provider === 'asaas') {
            // No asaas a validação secundária pode vir de um header estático configurado no painel ou secret hmac
            $secret = $workspace->integrations()->where('provider', 'asaas')->first()?->meta['webhook_secret'] ?? '';
        } else {
            // Messaging Providers
            $integration = $workspace->integrations()->where('provider', $provider)->first();
            $secret = $integration?->meta['webhook_secret'] ?? config("services.messaging.webhook_secret");
        }

        // 1. Fail-Safe: Bloquear se segredo não configurado fora do ambiente local
        if (!app()->environment('local', 'testing') && empty($secret) && $provider !== 'evolution') {
            Log::critical('WEBHOOK CRITICAL: Secret não configurado em ambiente protegido!', [
                'ip' => $request->ip(),
                'workspace' => $workspace->slug
            ]);
            return response()->json(['ok' => false, 'message' => 'Configuração segura ausente'], 500);
        }

        // 2. Validação Anti-Replay (Janela de 5 min)
        if (abs(time() - (int)$timestamp) > 300) {
            return response()->json(['ok' => false, 'message' => 'Request expirado (Timestamp drift)'], 401);
        }

        if (!empty($secret) && $provider !== 'evolution') {
            $expectedSignature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
            $isValid = hash_equals($expectedSignature, (string)$signature);
            // Fallback for some providers like asaas that just send a static token in the header
            if (!$isValid && $signature === $secret) {
                $isValid = true;
            }

            if (!$isValid) {
                Log::warning("Tentativa de webhook com assinatura inválida ({$provider})", [
                    'ip' => $request->ip(),
                    'expected_sig' => $expectedSignature,
                    'received_sig' => $signature,
                    'event_id' => json_decode($payload, true)['event_id'] ?? null
                ]);
                return response()->json(['ok' => false, 'message' => 'Assinatura inválida'], 401);
            }
        }
        
        $data = json_decode($payload, true);
        $eventId = $data['event_id'] ?? null;

        if (!$eventId) {
            return response()->json(['ok' => false, 'message' => 'event_id ausente'], 422);
        }

        // 4. Idempotência (R5)
        $alreadyProcessed = WebhookAudit::where('provider', $provider)
            ->where('event_id', $eventId)
            ->exists();

        if ($alreadyProcessed) {
            return response()->json(['ok' => true, 'action' => 'already_processed']);
        }

        // A remoção da lógica de pagamentos unificou Single Responsibility!
        // O escopo atual agora valida PURAMENTE agendamentos.
        
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

        if (str_contains($text, 'CONFIRMAR')) {
            $appointment->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
            ]);

            $this->auditEvent($provider, $eventId);
            return response()->json(['ok' => true, 'action' => 'confirmed']);
        }

        if (str_contains($text, 'REAGENDAR')) {
            $appointment->update([
                'status' => 'canceled',
            ]);

            $this->auditEvent($provider, $eventId);
            return response()->json(['ok' => true, 'action' => 'reschedule_requested']);
        }

        return response()->json(['ok' => true, 'action' => 'ignored']);
    }

    private function auditEvent($provider, $eventId)
    {
        WebhookAudit::create([
            'provider' => $provider,
            'event_id' => $eventId,
        ]);
    }
}