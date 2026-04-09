<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkspaceSubscriptionEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'subscription_id',
        'event_type',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function subscription()
    {
        return $this->belongsTo(WorkspaceSubscription::class, 'subscription_id');
    }
}
