<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkspaceIntegration extends Model
{
    use HasFactory, \App\Traits\BelongsToTenant;

    protected $fillable = [
        'workspace_id',
        'type',
        'provider',
        'credentials',
        'status',
        'meta',
        'last_check_at',
    ];

    protected function casts(): array
    {
        return [
            'credentials' => 'encrypted:array',
            'meta' => 'array',
            'last_check_at' => 'datetime',
        ];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
