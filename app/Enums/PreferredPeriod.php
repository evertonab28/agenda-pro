<?php

namespace App\Enums;

enum PreferredPeriod: string
{
    case Morning = 'morning';
    case Afternoon = 'afternoon';
    case Night = 'night';
    case Any = 'any';

    public function label(): string
    {
        return match ($this) {
            self::Morning => 'Manhã',
            self::Afternoon => 'Tarde',
            self::Night => 'Noite',
            self::Any => 'Qualquer Horário',
        };
    }
}
