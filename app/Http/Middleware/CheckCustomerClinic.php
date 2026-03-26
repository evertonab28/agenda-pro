<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Clinic;

class CheckCustomerClinic
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $clinic = $request->route('clinic');

        if (!$clinic) {
            abort(404);
        }

        $customer = Auth::guard('customer')->user();

        if ($customer && $customer->clinic_id !== $clinic->id) {
            Auth::guard('customer')->logout();
            return redirect()->route('portal.login', $clinic->slug)->with('error', 'Sessão inválida para esta clínica.');
        }

        return $next($request);
    }
}
