<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookAudit extends Model
{
    public $timestamps = false;

    protected $fillable = ['workspace_id', 'provider', 'type', 'event_id', 'processed_at'];

    protected function casts(): array
    {
        return [
            'processed_at' => 'datetime',
        ];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}
