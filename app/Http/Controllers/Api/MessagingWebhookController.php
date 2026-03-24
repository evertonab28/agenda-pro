<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;

class MessagingWebhookController extends Controller
{
public function inbound(Request $request)
{
    $token = $request->header('X-Webhook-Token') ?? $request->input('token');
    $secret = config('services.messaging.webhook_secret');

    if (!$token || ($secret && $token !== $secret)) {
        return response()->json(['ok' => false, 'message' => 'Token inválido ou ausente'], 401);
    }

    $phone = $request->string('from')->toString();

$appointment = Appointment::where('public_token', $token)->first();
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