<?php

namespace App\Models;

use App\Traits\Logged;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends Model
{
    use HasFactory, Logged, \App\Traits\BelongsToTenant;

    protected $fillable = [
        'clinic_id',
        'charge_id',
        'amount_received',
        'fee_amount',
        'net_amount',
        'method',
        'received_at',
        'notes',
    ];

    protected $casts = [
        'amount_received' => 'decimal:2',
        'fee_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'received_at' => 'datetime',
    ];

    public function charge(): BelongsTo
    {
        return $this->belongsTo(Charge::class);
    }
}
