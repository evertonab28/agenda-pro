<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (app()->runningInConsole() && !app()->runningUnitTests()) {
            return;
        }

        $clinicId = null;

        // Check web guard first (Staff)
        if (Auth::guard('web')->hasUser()) {
            $clinicId = Auth::guard('web')->user()->clinic_id;
        } 
        // Then check customer guard
        elseif (Auth::guard('customer')->hasUser()) {
            $clinicId = Auth::guard('customer')->user()->clinic_id;
        }

        if ($clinicId) {
            $builder->where($model->getTable() . '.clinic_id', $clinicId);
        }
    }
}
