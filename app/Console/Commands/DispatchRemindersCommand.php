<?php

namespace App\Console\Commands;

use App\Jobs\SendReminderJob;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\ReminderLog;
use Illuminate\Console\Command;

class DispatchRemindersCommand extends Command
{
protected $signature = 'reminders:dispatch';
protected $description = 'Enfileira lembretes D-1, H-2, D+1 e D+3';

public function handle(): int
{
$this->dispatchConfirmD1();
$this->dispatchConfirmH2();
$this->dispatchChargeD1();
$this->dispatchChargeD3();

$this->info('Reminders enfileirados.');
return self::SUCCESS;
}

private function dispatchConfirmD1(): void
{
Appointment::whereIn('status', ['scheduled','rescheduled'])
->whereBetween('starts_at', [now()->addDay()->startOfHour(), now()->addDay()->endOfHour()])
->each(function (Appointment $a) {
if ($this->alreadySent($a->id, null, 'confirm_d1')) return;
SendReminderJob::dispatch('confirm_d1', 'whatsapp', $a->id);
});
}

private function dispatchConfirmH2(): void
{
Appointment::whereIn('status', ['scheduled','rescheduled'])
->whereBetween('starts_at', [now()->addHours(2)->startOfHour(), now()->addHours(2)->endOfHour()]
)
->each(function (Appointment $a) {
if ($this->alreadySent($a->id, null, 'confirm_h2')) return;
SendReminderJob::dispatch('confirm_h2', 'whatsapp', $a->id);
});
}

private function dispatchChargeD1(): void
{
Charge::where('status', 'pending')
->whereDate('due_date', now()->subDay()->toDateString())
->each(function (Charge $c) {
if ($this->alreadySent(null, $c->id, 'charge_d1')) return;
SendReminderJob::dispatch('charge_d1', 'whatsapp', null, $c->id);
});
}

private function dispatchChargeD3(): void
{
Charge::where('status', 'pending')
->whereDate('due_date', now()->subDays(3)->toDateString())
->each(function (Charge $c) {
if ($this->alreadySent(null, $c->id, 'charge_d3')) return;
SendReminderJob::dispatch('charge_d3', 'whatsapp', null, $c->id);
});
}

private function alreadySent(?int $appointmentId, ?int $chargeId, string $type): bool
{
return ReminderLog::where('type', $type)
->when($appointmentId, fn($q) => $q->where('appointment_id', $appointmentId))
->when($chargeId, fn($q) => $q->where('charge_id', $chargeId))
->whereIn('status', ['queued','sent'])
->exists();
}
}