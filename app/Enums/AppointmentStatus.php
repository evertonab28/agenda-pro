<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Scheduled  = 'scheduled';
    case Confirmed  = 'confirmed';
    case Completed  = 'completed';
    case NoShow     = 'no_show';
    case Canceled   = 'canceled';

    public function label(): string
    {
        return match($this) {
            self::Scheduled => 'Agendado',
            self::Confirmed => 'Confirmado',
            self::Completed => 'Concluído',
            self::NoShow    => 'Falta',
            self::Canceled  => 'Cancelado',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
