<?php

namespace App\Models;

use App\Traits\Logged;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Charge extends Model
{
    use HasFactory, Logged, \App\Traits\BelongsToTenant;

    protected $fillable = [
        'clinic_id',
        'description',
        'appointment_id',
        'customer_id',
        'amount',
        'status',
        'due_date',
        'paid_at',
        'payment_method',
        'notes',
        'reference_month',
        'reference_year',
        'payment_link_hash',
        'payment_link_clicks',
        'payment_link_expires_at',
        'payment_provider_id',
        'reference_type',
        'reference_id',
    ];

protected $casts = [
'amount' => 'decimal:2',
'due_date' => 'date',
'paid_at' => 'datetime',
'payment_link_expires_at' => 'datetime',
];

public function appointment(): BelongsTo
{
return $this->belongsTo(Appointment::class);
}

public function reminders(): HasMany
{
return $this->hasMany(ReminderLog::class);
}

public function customer(): BelongsTo
{
return $this->belongsTo(Customer::class);
}

public function receipts(): HasMany
{
return $this->hasMany(Receipt::class);
}
}