<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Models\Charge;
use App\Models\ReminderLog;
use App\Services\Messaging\MessagingServiceInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendReminderJob implements ShouldQueue
{
use Queueable;

public function __construct(
public string $type,
public string $channel = 'whatsapp',
public ?int $appointmentId = null,
public ?int $chargeId = null
) {}

public function handle(MessagingServiceInterface $messaging): void
{
$appointment = $this->appointmentId ? Appointment::with(['customer','service'])->find($this->appointmentId) : null;
$charge = $this->chargeId ? Charge::with(['appointment.customer'])->find($this->chargeId) : null;

$targetPhone = $appointment?->customer?->phone ?? $charge?->appointment?->customer?->phone;
$workspaceId = $appointment?->workspace_id ?? $charge?->workspace_id;

if (!$targetPhone) {
ReminderLog::create([
'workspace_id' => $workspaceId,
'appointment_id' => $appointment?->id,
'charge_id' => $charge?->id,
'type' => $this->type,
'channel' => $this->channel,
'status' => 'failed',
'error_message' => 'Cliente sem telefone',
]);
return;
}

$message = $this->buildMessage($appointment, $charge);

$result = $messaging->send($targetPhone, $message, [
'type' => $this->type,
'appointment_id' => $appointment?->id,
'charge_id' => $charge?->id,
'token' => $appointment?->public_token,
]);

ReminderLog::create([
'workspace_id' => $workspaceId,
'appointment_id' => $appointment?->id,
'charge_id' => $charge?->id,
'type' => $this->type,
'channel' => $this->channel,
'payload' => [
'message' => $message,
'to' => $targetPhone,
'provider' => $result,
],
'sent_at' => now(),
'status' => ($result['ok'] ?? false) ? 'sent' : 'failed',
'error_message' => ($result['ok'] ?? false) ? null : 'Falha no provider',
]);
}

private function buildMessage(?Appointment $appointment, ?Charge $charge): string
{
return match ($this->type) {
'confirm_d1' => "Lembrete: seu atendimento é amanhã às ".$appointment?->starts_at?->format('H:i').". Responda CONFIRMAR ou REAGENDAR.",
'confirm_h2' => "Seu atendimento começa em ~2h (".$appointment?->starts_at?->format('H:i')."). Responda CONFIRMAR ou REAGENDAR.",
'charge_d1' => "Lembrete de pagamento pendente (D+1). Valor: R$ ".number_format((float)($charge?->amount ?? 0), 2, ',', '.'),
'charge_d3' => "Lembrete final de pagamento pendente (D+3). Valor: R$ ".number_format((float)($charge?->amount ?? 0), 2, ',', '.'),
default => "Lembrete automático.",
};
}
}