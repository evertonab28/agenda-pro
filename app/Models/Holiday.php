<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Holiday extends Model
{
    use HasFactory, \App\Traits\BelongsToTenant;

    protected $fillable = [
        'workspace_id',
        'name',
        'date',
        'professional_id',
        'repeats_yearly',
    ];


    protected $casts = [
        'repeats_yearly' => 'boolean',
        'date' => 'date',
    ];

    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }
}
