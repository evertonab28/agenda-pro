<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\WaitlistStatus;
use App\Enums\PreferredPeriod;

class WaitlistEntry extends Model
{
    use HasFactory, \App\Traits\BelongsToTenant;

    protected $fillable = [
        'clinic_id',
        'customer_id',
        'service_id',
        'professional_id',
        'preferred_period',
        'notes',
        'status',
        'priority',
    ];

    protected $casts = [
        'status' => WaitlistStatus::class,
        'preferred_period' => PreferredPeriod::class,
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }
}
