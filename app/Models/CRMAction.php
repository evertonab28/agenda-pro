<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CRMAction extends Model
{
    protected $table = 'crm_actions';

    protected $fillable = [
        'clinic_id',
        'customer_id',
        'type',
        'status',
        'priority',
        'title',
        'description',
        'action_data',
        'valid_until',
    ];

    protected $casts = [
        'action_data' => 'array',
        'valid_until' => 'datetime',
    ];

    public function clinic(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function customer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\TenantScope);
    }
}
