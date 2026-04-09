<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkspaceSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'plan_id',
        'status',
        'trial_ends_at',
        'starts_at',
        'ends_at',
        'canceled_at',
        'grace_ends_at',
        'external_id',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'canceled_at' => 'datetime',
            'grace_ends_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function isActive(): bool
    {
        if ($this->status === 'trialing') {
            return $this->trial_ends_at && $this->trial_ends_at->isFuture();
        }

        return $this->status === 'active' && (!$this->ends_at || $this->ends_at->isFuture());
    }

    public function isTrialing(): bool
    {
        return $this->status === 'trialing' && $this->trial_ends_at->isFuture();
    }
}
