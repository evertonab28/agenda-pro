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
    public function inbound(Request $request)
    {
        $signature = $request->header('X-Webhook-Signature');
        $timestamp = $request->header('X-Webhook-Timestamp');
        $secret = config('services.messaging.webhook_secret');
        $payload = $request->getContent();

        // 1. Fail-Safe: Bloquear se segredo não configurado fora do ambiente de dev/local
        if (!app()->environment('local', 'testing') && empty($secret)) {
            Log::critical('WEBHOOK CRITICAL: Secret não configurado em ambiente protegido!', [
                'ip' => $request->ip()
            ]);
            return response()->json(['ok' => false, 'message' => 'Configuração segura ausente'], 500);
        }

        // 2. Validação Anti-Replay (Janela de 5 min)
        if (abs(time() - (int)$timestamp) > 300) {
            return response()->json(['ok' => false, 'message' => 'Request expirado (Timestamp drift)'], 401);
        }

        if (!empty($secret)) {
            $expectedSignature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
            if (!hash_equals($expectedSignature, (string)$signature)) {
                Log::warning('Tentativa de webhook com assinatura inválida', [
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
        $alreadyProcessed = WebhookAudit::where('provider', 'messaging')
            ->where('event_id', $eventId)
            ->exists();

        if ($alreadyProcessed) {
            return response()->json(['ok' => true, 'action' => 'already_processed']);
        }

        // --- Processamento Original com Tenant Isolation Safeness ---
        
        // Suporte para Webhooks de Pagamento (TC-REG-001)
        $externalId = $data['id'] ?? null;
        if ($externalId && ($data['status'] ?? null) === 'paid') {
            $charge = Charge::withoutGlobalScopes()->where('payment_provider_id', $externalId)->first();
            if ($charge) {
                $charge->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);
                
                $this->auditEvent('messaging', $eventId);
                Log::info("Webhook: Charge {$charge->id} (Workspace {$charge->workspace_id}) atualizado para paid via event {$eventId}");
                return response()->json(['ok' => true, 'action' => 'payment_recorded']);
            } else {
                Log::warning("Webhook payment_provider_id {$externalId} não encontrou charge correspondente. Event: {$eventId}");
            }
        }

        $appointmentToken = $data['appointment_token'] ?? $data['token'] ?? null;

        if (!$appointmentToken) {
            return response()->json(['ok' => false, 'message' => 'Token do agendamento ausente'], 422);
        }

        $appointment = Appointment::withoutGlobalScopes()->where('public_token', $appointmentToken)->first();
        if (!$appointment) {
            return response()->json(['ok' => false, 'message' => 'Agendamento não encontrado'], 404);
        }

        $text = mb_strtoupper(trim($data['text'] ?? ''));

        if (str_contains($text, 'CONFIRMAR')) {
            $appointment->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
            ]);

            $this->auditEvent('messaging', $eventId);
            return response()->json(['ok' => true, 'action' => 'confirmed']);
        }

        if (str_contains($text, 'REAGENDAR')) {
            $appointment->update([
                'status' => 'rescheduled',
            ]);

            $this->auditEvent('messaging', $eventId);
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