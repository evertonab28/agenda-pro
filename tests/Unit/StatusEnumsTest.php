<?php

namespace Tests\Unit;

use App\Enums\AppointmentStatus;
use App\Enums\ChargeStatus;
use PHPUnit\Framework\TestCase;

class StatusEnumsTest extends TestCase
{
    // ──────────────────────────────────────────
    // AppointmentStatus
    // ──────────────────────────────────────────

    public function test_appointment_status_has_correct_values()
    {
        $this->assertSame('scheduled',  AppointmentStatus::Scheduled->value);
        $this->assertSame('confirmed',  AppointmentStatus::Confirmed->value);
        $this->assertSame('completed',  AppointmentStatus::Completed->value);
        $this->assertSame('no_show',    AppointmentStatus::NoShow->value);
        $this->assertSame('canceled',   AppointmentStatus::Canceled->value);
    }

    public function test_appointment_status_labels_are_in_portuguese()
    {
        $this->assertSame('Agendado',   AppointmentStatus::Scheduled->label());
        $this->assertSame('Confirmado', AppointmentStatus::Confirmed->label());
        $this->assertSame('Concluído',  AppointmentStatus::Completed->label());
        $this->assertSame('Falta',      AppointmentStatus::NoShow->label());
        $this->assertSame('Cancelado',  AppointmentStatus::Canceled->label());
    }

    public function test_appointment_status_values_returns_all_strings()
    {
        $values = AppointmentStatus::values();

        $this->assertIsArray($values);
        $this->assertCount(5, $values);
        $this->assertContains('scheduled', $values);
        $this->assertContains('no_show', $values);
        $this->assertContains('canceled', $values);
    }

    public function test_appointment_status_can_be_created_from_value()
    {
        $status = AppointmentStatus::from('completed');
        $this->assertSame(AppointmentStatus::Completed, $status);
    }

    public function test_appointment_status_throws_on_invalid_value()
    {
        $this->expectException(\ValueError::class);
        AppointmentStatus::from('invalid_value');
    }

    // ──────────────────────────────────────────
    // ChargeStatus
    // ──────────────────────────────────────────

    public function test_charge_status_has_correct_values()
    {
        $this->assertSame('pending',  ChargeStatus::Pending->value);
        $this->assertSame('partial',  ChargeStatus::Partial->value);
        $this->assertSame('paid',     ChargeStatus::Paid->value);
        $this->assertSame('overdue',  ChargeStatus::Overdue->value);
        $this->assertSame('canceled', ChargeStatus::Canceled->value);
    }

    public function test_charge_status_labels_are_in_portuguese()
    {
        $this->assertSame('Pendente',  ChargeStatus::Pending->label());
        $this->assertSame('Parcial',   ChargeStatus::Partial->label());
        $this->assertSame('Pago',      ChargeStatus::Paid->label());
        $this->assertSame('Vencido',   ChargeStatus::Overdue->label());
        $this->assertSame('Cancelado', ChargeStatus::Canceled->label());
    }

    public function test_charge_status_values_returns_all_strings()
    {
        $values = ChargeStatus::values();

        $this->assertIsArray($values);
        $this->assertCount(5, $values);
        $this->assertContains('pending', $values);
        $this->assertContains('paid', $values);
        $this->assertContains('overdue', $values);
    }

    public function test_charge_status_can_be_created_from_value()
    {
        $status = ChargeStatus::from('paid');
        $this->assertSame(ChargeStatus::Paid, $status);
    }
}
