<?php

namespace App\Enums;

enum ChargeStatus: string
{
    case Pending  = 'pending';
    case Partial  = 'partial';
    case Paid     = 'paid';
    case Overdue  = 'overdue';
    case Canceled = 'canceled';

    public function label(): string
    {
        return match($this) {
            self::Pending  => 'Pendente',
            self::Partial  => 'Parcial',
            self::Paid     => 'Pago',
            self::Overdue  => 'Vencido',
            self::Canceled => 'Cancelado',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
