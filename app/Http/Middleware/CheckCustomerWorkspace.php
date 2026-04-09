<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Workspace;

class CheckCustomerWorkspace
{
    /**
     * Validate that the authenticated customer belongs to the workspace in the route.
     */
    public function handle(Request $request, Closure $next)
    {
        $workspace = $request->route('workspace');

        if (!$workspace) {
            abort(404);
        }

        $customer = Auth::guard('customer')->user();

        if ($customer && $customer->workspace_id !== $workspace->id) {
            Auth::guard('customer')->logout();
            return redirect()->route('portal.login', $workspace->slug)
                ->with('error', 'Sessão inválida para este workspace.');
        }

        return $next($request);
    }
}
