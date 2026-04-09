<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Models\User;
use App\Services\Subscription\SubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('manage-settings');

        $workspace = $request->user()->workspace;
        $subscription = $workspace->subscription()->with('plan')->first();
        
        $subscriptionService = app(SubscriptionService::class);

        // Calcular uso atual vs limites
        $stats = [
            'professionals' => [
                'current' => $workspace->professionals()->count(),
                'limit' => $subscriptionService->getLimit($workspace, 'max_professionals', 0),
            ],
            'users' => [
                'current' => $workspace->users()->count(),
                'limit' => $subscriptionService->getLimit($workspace, 'max_users', 0),
            ],
        ];

        return Inertia::render('Configurations/Billing/Index', [
            'subscription' => $subscription,
            'stats' => $stats,
        ]);
    }
}
