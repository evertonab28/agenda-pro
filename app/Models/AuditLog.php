<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'entity',
        'entity_id',
        'payload',
        'ip',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'payload'    => 'array',
    ];

    public static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            $model->created_at = now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
