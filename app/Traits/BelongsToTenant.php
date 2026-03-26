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

        // Automatically set clinic_id on creation
        static::creating(function (Model $model) {
            if (!$model->clinic_id) {
                if (Auth::guard('web')->check()) {
                    $model->clinic_id = Auth::guard('web')->user()->clinic_id;
                } elseif (Auth::guard('customer')->check()) {
                    $model->clinic_id = Auth::guard('customer')->user()->clinic_id;
                }
            }
        });
    }
}
