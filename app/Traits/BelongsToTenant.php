<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    /**
     * Boot the trait.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Automatically apply TenantScope
        static::addGlobalScope(new TenantScope);

        // Automatically set workspace_id on creation
        static::creating(function (Model $model) {
            if (!$model->workspace_id) {
                if (Auth::guard('web')->check()) {
                    $model->workspace_id = Auth::guard('web')->user()->workspace_id;
                } elseif (Auth::guard('customer')->check()) {
                    $model->workspace_id = Auth::guard('customer')->user()->workspace_id;
                }
            }
        });
    }
}
