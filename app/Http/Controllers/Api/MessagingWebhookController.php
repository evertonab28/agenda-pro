<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;

class MessagingWebhookController extends Controller
{
public function inbound(Request $request)
{
    $webhookToken = $request->header('X-Webhook-Token');
    $secret = config('services.messaging.webhook_secret');

    // Autenticação do webhook (segredo compartilhado do provider)
    // Se o segredo não estiver definido, bloqueia por padrão por segurança
    if (empty($secret) || $webhookToken !== $secret) {
        logger()->warning('Tentativa de webhook não autorizada ou segredo não configurado', [
            'ip' => $request->ip(),
            'token_sent' => (bool)$webhookToken,
            'secret_configured' => (bool)$secret
        ]);
        return response()->json(['ok' => false, 'message' => 'Não autorizado'], 401);
    }

    $phone = $request->string('from')->toString(); // formato provider
    $text = mb_strtoupper(trim($request->string('text')->toString()));
    $appointmentToken = $request->input('appointment_token') ?? $request->input('token');

    if (!$appointmentToken) {
        return response()->json(['ok' => false, 'message' => 'Token do agendamento ausente'], 422);
    }

    $appointment = Appointment::where('public_token', $appointmentToken)->first();
if (!$appointment) {
return response()->json(['ok' => false, 'message' => 'Agendamento não encontrado'], 404);
}

// Opcional: validar telefone bate com customer
if ($appointment->customer?->phone && $phone && !str_contains($appointment->customer->phone, preg_replace('/\D/', '', $phone))) {
// só loga por enquanto
logger()->warning('Telefone divergente no inbound', compact('phone'));
}

if (str_contains($text, 'CONFIRMAR')) {
$appointment->update([
'status' => 'confirmed',
'confirmed_at' => now(),
]);

return response()->json(['ok' => true, 'action' => 'confirmed']);
}

if (str_contains($text, 'REAGENDAR')) {
$appointment->update([
'status' => 'rescheduled',
]);

// aqui depois podemos disparar fluxo de escolha de novo horário
return response()->json(['ok' => true, 'action' => 'reschedule_requested']);
}

return response()->json(['ok' => true, 'action' => 'ignored']);
}
}