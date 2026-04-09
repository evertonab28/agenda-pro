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

        $workspaceId = null;

        // Check web guard first (Staff)
        if (Auth::guard('web')->hasUser()) {
            $workspaceId = Auth::guard('web')->user()->workspace_id;
        }
        // Then check customer guard
        elseif (Auth::guard('customer')->hasUser()) {
            $workspaceId = Auth::guard('customer')->user()->workspace_id;
        }

        if ($workspaceId) {
            $builder->where($model->getTable() . '.workspace_id', $workspaceId);
        }
    }
}
