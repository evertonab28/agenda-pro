<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Logged
{
    /**
     * Boot the trait.
     */
    public static function bootLogged(): void
    {
        static::created(function ($model) {
            $model->auditAction('created');
        });

        static::updated(function ($model) {
            $model->auditAction('updated');
        });

        static::deleted(function ($model) {
            $model->auditAction('deleted');
        });
    }

    /**
     * Record the audit log.
     */
    protected function auditAction(string $event): void
    {
        $payload = [];

        if ($event === 'updated') {
            $payload['old'] = array_intersect_key($this->getOriginal(), $this->getDirty());
            $payload['new'] = $this->getDirty();
            
            // LGPD: Remover PII do log se necessário. 
            // Para Charge/Receipt, os campos sensíveis são limitados, 
            // mas removeremos 'notes' se contiverem PII.
            unset($payload['old']['notes'], $payload['new']['notes']);
        }

        AuditLog::create([
            'user_id' => Auth::id(),
            'action'  => strtolower(class_basename($this)) . '.' . $event,
            'entity'  => class_basename($this),
            'entity_id' => $this->id,
            'payload' => $payload,
            'ip'      => Request::ip(),
        ]);
    }
}
