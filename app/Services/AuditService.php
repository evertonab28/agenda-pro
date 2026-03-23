<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class AuditService
{
    /**
     * Record an audit event.
     *
     * @param User|null $user     The user performing the action.
     * @param string    $action   Dot-notation action (e.g., 'appointment.created').
     * @param Model|null $entity  The Eloquent model being audited.
     * @param array     $payload  Optional extra context (non-sensitive only).
     */
    public static function log(?User $user, string $action, ?Model $entity = null, array $payload = []): void
    {
        try {
            AuditLog::create([
                'user_id'   => $user?->id,
                'action'    => $action,
                'entity'    => $entity ? class_basename($entity) : 'System',
                'entity_id' => $entity?->getKey(),
                'payload'   => empty($payload) ? null : json_encode($payload),
                'ip'        => request()->ip(),
            ]);
        } catch (\Throwable $e) {
            // Never let audit failures crash the app, just log it.
            Log::warning("AuditService failed to log [{$action}]: {$e->getMessage()}");
        }
    }
}
