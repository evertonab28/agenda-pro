<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Charge extends Model
{
protected $fillable = [
'appointment_id',
'amount',
'status',
'due_date',
'paid_at',
'payment_method',
'external_reference',
];

protected $casts = [
'amount' => 'decimal:2',
'due_date' => 'date',
'paid_at' => 'datetime',
];

public function appointment(): BelongsTo
{
return $this->belongsTo(Appointment::class);
}

public function reminders(): HasMany
{
return $this->hasMany(ReminderLog::class);
}
}