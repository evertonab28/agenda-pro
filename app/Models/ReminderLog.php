<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReminderLog extends Model
{
protected $fillable = [
'appointment_id',
'charge_id',
'type',
'channel',
'payload',
'sent_at',
'status',
'error_message',
];

protected $casts = [
'payload' => 'array',
'sent_at' => 'datetime',
];

public function appointment(): BelongsTo
{
return $this->belongsTo(Appointment::class);
}

public function charge(): BelongsTo
{
return $this->belongsTo(Charge::class);
}
}