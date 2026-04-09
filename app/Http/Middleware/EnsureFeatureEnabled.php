<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureEnabled
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $workspace = $request->user()?->workspace;
        
        if (!$workspace) {
            return $next($request);
        }

        $subscriptionService = app(\App\Services\Subscription\SubscriptionService::class);

        if (!$subscriptionService->canUseFeature($workspace, $feature)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Esta funcionalidade não está disponível no seu plano atual.',
                    'feature' => $feature
                ], 403);
            }

            return redirect()->route('configuracoes.billing.index')
                ->with('warning', 'Seu plano atual não inclui acesso a este recurso. Considere fazer um upgrade!');
        }

        return $next($request);
    }
}
