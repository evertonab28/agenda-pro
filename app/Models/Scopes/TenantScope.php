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
        // dump("Applying scope to " . $model->getTable());
        if (Auth::check() && Auth::user()->clinic_id) {
            $builder->where($model->getTable() . '.clinic_id', Auth::user()->clinic_id);
        }
    }
}
