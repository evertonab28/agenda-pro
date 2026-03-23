<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Service;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;

class CheckOnboarding
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip for onboarding routes and logout
        if ($request->routeIs('onboarding.*') || $request->routeIs('configuracoes.*') || $request->routeIs('logout')) {
            return $next($request);
        }

        // Only for admin/manager
        if ($request->user() && in_array($request->user()->role, ['admin', 'manager'])) {
            $hasSettings = \App\Models\Setting::where('key', 'company_name')->exists();
            $hasServices = Service::exists();
            $hasProfessionals = Professional::exists();
            $hasSchedules = ProfessionalSchedule::exists();

            if (!$hasSettings || !$hasServices || !$hasProfessionals || !$hasSchedules) {
                return redirect()->route('onboarding.index');
            }
        }

        return $next($request);
    }
}
