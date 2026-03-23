<?php

namespace App\Enums;

enum WaitlistStatus: string
{
    case Waiting = 'waiting';
    case Called = 'called';
    case Converted = 'converted';
    case Canceled = 'canceled';

    public function label(): string
    {
        return match ($this) {
            self::Waiting => 'Aguardando',
            self::Called => 'Chamado',
            self::Converted => 'Convertido',
            self::Canceled => 'Cancelado',
        };
    }
}
