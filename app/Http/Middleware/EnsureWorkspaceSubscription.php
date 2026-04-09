<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $workspace = $request->user()?->workspace;

        if (!$workspace) {
            return $next($request);
        }

        $subscription = $workspace->subscription()->first();

        if (!$subscription || !$subscription->isActive()) {
            // Allow access to configuration area even if subscription is invalid for regularization
            if ($request->is('configuracoes*') || $request->is('api/billing*')) {
                return $next($request);
            }

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Assinatura inválida ou trial expirado.'], 402);
            }

            return redirect()->route('configuracoes.billing.index')
                ->with('error', 'Sua assinatura expirou. Por favor, regularize para continuar usando o sistema.');
        }

        return $next($request);
    }
}
