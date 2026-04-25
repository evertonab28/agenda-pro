<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Appointment extends Model
{
    use HasFactory, \App\Traits\BelongsToTenant;
    
    protected $fillable = [
        'workspace_id',
        'customer_id',
        'service_id',
        'professional_id',
        'starts_at',
        'ends_at',
        'status',
        'confirmation_token',
        'public_token',
        'confirmed_at',
        'source',
        'notes',
        'cancel_reason',
        'total_price',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'buffered_ends_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'total_price' => 'decimal:2',
    ];

    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class, 'professional_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function charge(): HasOne
    {
        return $this->hasOne(Charge::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(ReminderLog::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(AppointmentItem::class);
    }
}