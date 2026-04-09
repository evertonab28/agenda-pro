<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceBillingInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'subscription_id',
        'plan_id',
        'amount',
        'status',
        'provider',
        'provider_invoice_id',
        'provider_payment_link',
        'due_date',
        'paid_at',
        'reference_period',
        'meta',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'meta' => 'array',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(WorkspaceSubscription::class, 'subscription_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
