<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentItem extends Model
{
    protected $fillable = [
        'appointment_id',
        'service_id',
        'name',
        'price',
        'duration_minutes',
        'is_main',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_main' => 'boolean',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
