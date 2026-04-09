<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessionalSchedule extends Model
{
    use HasFactory, \App\Traits\BelongsToTenant;

    protected $fillable = [
        'workspace_id',
        'professional_id',
        'weekday',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
        'is_active',
    ];


    protected $casts = [
        'is_active' => 'boolean',
        'weekday' => 'integer',
    ];

    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }
}
