<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookAudit extends Model
{
    public $timestamps = false;
    protected $fillable = ['provider', 'event_id', 'processed_at'];
}
