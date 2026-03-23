<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Service;
use App\Models\Professional;
use App\Models\ProfessionalSchedule;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                ] : null,
                'can' => $request->user() ? [
                    'manage_users' => $request->user()->role === 'admin',
                    'view_finance' => in_array($request->user()->role, ['admin', 'manager']),
                    'manage_settings' => in_array($request->user()->role, ['admin', 'manager']),
                ] : [],
                'hide_nav' => $request->user() && 
                             (in_array($request->user()->role, ['admin', 'manager'])) && 
                             (!Service::exists() || !Professional::exists() || !ProfessionalSchedule::exists()) &&
                             ($request->routeIs('onboarding.*') || $request->routeIs('configuracoes.*')),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
