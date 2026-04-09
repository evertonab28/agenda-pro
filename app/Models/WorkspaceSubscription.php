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
        'cancellation_category',
        'cancellation_reason',
        'cancellation_recorded_at',
        'canceled_by',
        'winback_candidate',
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
            'cancellation_recorded_at' => 'datetime',
            'grace_ends_at' => 'datetime',
            'winback_candidate' => 'boolean',
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

        // Permite acesso se estiver ativo ou cancelado porém ainda dentro do período pago
        $validStatus = in_array($this->status, ['active', 'canceled']);
        
        return $validStatus && (!$this->ends_at || $this->ends_at->isFuture());
    }

    public function isTrialing(): bool
    {
        return $this->status === 'trialing' && $this->trial_ends_at->isFuture();
    }
    public function events()
    {
        return $this->hasMany(WorkspaceSubscriptionEvent::class, 'subscription_id');
    }
}
