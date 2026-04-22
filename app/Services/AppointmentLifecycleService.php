<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Enums\ChargeStatus;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AppointmentLifecycleService
{
    public function __construct(
        private AgendaService $agendaService,
        private CheckoutService $checkoutService,
        private CRMService $crmService,
    ) {}

    public function confirm(Appointment $appointment, ?User $actor = null): Appointment
    {
        return DB::transaction(function () use ($appointment, $actor) {
            $appointment = $this->lockAppointment($appointment);

            if ($appointment->status !== AppointmentStatus::Confirmed->value) {
                $appointment->update([
                    'status' => AppointmentStatus::Confirmed->value,
                    'confirmed_at' => $appointment->confirmed_at ?? now(),
                ]);

                AuditService::log($actor, 'appointment.confirmed', $appointment);
            } elseif (!$appointment->confirmed_at) {
                $appointment->update(['confirmed_at' => now()]);
            }

            return $appointment->fresh();
        });
    }

    public function cancel(Appointment $appointment, ?string $reason = null, ?User $actor = null): Appointment
    {
        return DB::transaction(function () use ($appointment, $reason, $actor) {
            $appointment = $this->lockAppointment($appointment);
            $wasCanceled = $appointment->status === AppointmentStatus::Canceled->value;

            $payload = ['status' => AppointmentStatus::Canceled->value];
            if ($reason !== null) {
                $payload['cancel_reason'] = $reason;
            }

            if (!$wasCanceled || $reason !== null) {
                $appointment->update($payload);
            }

            $this->cancelOpenChargeIfOperationallySafe($appointment);

            if (!$wasCanceled) {
                $this->crmService->triggerAppointmentCanceled($appointment);
                AuditService::log($actor, 'appointment.canceled', $appointment, [
                    'reason' => $reason,
                ]);
            }

            return $appointment->fresh();
        });
    }

    public function reschedule(Appointment $appointment, string|Carbon $startsAt, ?string $notes = null, ?User $actor = null): Appointment
    {
        $startsAt = Carbon::parse($startsAt);
        $appointment->loadMissing('service');
        $endsAt = $startsAt->copy()->addMinutes($appointment->service->duration_minutes);

        $availability = $this->agendaService->isAvailable(
            $appointment->professional_id,
            $startsAt->toDateTimeString(),
            $endsAt->toDateTimeString(),
            $appointment->id,
            $appointment->service_id
        );

        if (!$availability['available']) {
            throw new \DomainException($availability['message'] ?? 'Horario indisponivel.');
        }

        return DB::transaction(function () use ($appointment, $startsAt, $endsAt, $notes, $actor) {
            $appointment = $this->lockAppointment($appointment);

            $payload = [
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => AppointmentStatus::Scheduled->value,
            ];

            if ($notes !== null) {
                $payload['notes'] = trim(($appointment->notes ? $appointment->notes . PHP_EOL : '') . '[REAGENDADO] ' . $notes);
            }

            $appointment->update($payload);
            $this->moveOpenChargeDueDateIfOperationallySafe($appointment);

            AuditService::log($actor, 'appointment.rescheduled', $appointment, [
                'starts_at' => $startsAt->toDateTimeString(),
                'ends_at' => $endsAt->toDateTimeString(),
            ]);

            return $appointment->fresh();
        });
    }

    public function complete(Appointment $appointment, ?User $actor = null): Appointment
    {
        return DB::transaction(function () use ($appointment, $actor) {
            $appointment = $this->lockAppointment($appointment);

            if ($appointment->status !== AppointmentStatus::Completed->value) {
                $appointment->update(['status' => AppointmentStatus::Completed->value]);
                AuditService::log($actor, 'appointment.completed', $appointment);
            }

            $this->checkoutService->ensureChargeForAppointment($appointment->fresh(['service']));

            return $appointment->fresh();
        });
    }

    public function markNoShow(Appointment $appointment, ?User $actor = null): Appointment
    {
        return DB::transaction(function () use ($appointment, $actor) {
            $appointment = $this->lockAppointment($appointment);
            $wasNoShow = $appointment->status === AppointmentStatus::NoShow->value;

            if (!$wasNoShow) {
                $appointment->update(['status' => AppointmentStatus::NoShow->value]);
                AuditService::log($actor, 'appointment.no_show', $appointment);
            }

            $this->checkoutService->ensureNoShowFeeForAppointment($appointment->fresh(['service']));

            return $appointment->fresh();
        });
    }

    private function lockAppointment(Appointment $appointment): Appointment
    {
        return Appointment::whereKey($appointment->id)->lockForUpdate()->firstOrFail();
    }

    private function cancelOpenChargeIfOperationallySafe(Appointment $appointment): void
    {
        $charge = Charge::withoutGlobalScopes()
            ->where('appointment_id', $appointment->id)
            ->lockForUpdate()
            ->first();

        if (!$charge || $charge->receipts()->exists()) {
            return;
        }

        if (in_array($charge->status, [ChargeStatus::Pending->value, ChargeStatus::Overdue->value], true)) {
            $charge->update(['status' => ChargeStatus::Canceled->value]);
        }
    }

    private function moveOpenChargeDueDateIfOperationallySafe(Appointment $appointment): void
    {
        $charge = Charge::withoutGlobalScopes()
            ->where('appointment_id', $appointment->id)
            ->lockForUpdate()
            ->first();

        if (!$charge || $charge->receipts()->exists()) {
            return;
        }

        if (in_array($charge->status, [ChargeStatus::Pending->value, ChargeStatus::Overdue->value], true)) {
            $charge->update([
                'status' => ChargeStatus::Pending->value,
                'due_date' => $appointment->starts_at->toDateString(),
            ]);
        }
    }
}
