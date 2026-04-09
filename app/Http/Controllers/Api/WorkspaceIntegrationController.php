<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkspaceIntegrationRequest;
use App\Models\WorkspaceIntegration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WorkspaceIntegrationController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('manage-settings'); // Assuming manage-settings is bound for admin
        
        $integrations = WorkspaceIntegration::where('workspace_id', $request->user()->workspace_id)
            ->get(['id', 'type', 'provider', 'status', 'last_check_at']);
            
        return response()->json($integrations);
    }

    public function store(StoreWorkspaceIntegrationRequest $request)
    {
        $workspaceId = $request->user()->workspace_id;

        $integration = WorkspaceIntegration::updateOrCreate(
            [
                'workspace_id' => $workspaceId,
                'type' => $request->type,
                'provider' => $request->provider,
            ],
            [
                'credentials' => $request->credentials,
                'status' => 'active',
                'last_check_at' => now(),
            ]
        );

        return response()->json(['ok' => true, 'id' => $integration->id]);
    }

    public function generateLink(Request $request, \App\Models\Charge $charge)
    {
        if ($charge->workspace_id !== $request->user()->workspace_id) {
            abort(403);
        }

        if ($charge->payment_link_hash && $charge->payment_provider_id) {
            return response()->json(['ok' => true, 'url' => route('payment.direct', $charge->payment_link_hash)]);
        }

        try {
            $paymentService = \App\Services\IntegrationProviderFactory::payment($charge->workspace);
            $url = $paymentService->generate($charge);
            return response()->json(['ok' => true, 'url' => $url]);
        } catch (\Exception $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function testConnection(Request $request, WorkspaceIntegration $integration)
    {
        if ($integration->workspace_id !== $request->user()->workspace_id) {
            abort(403);
        }

        try {
            if ($integration->type === 'payment') {
                $service = \App\Services\IntegrationProviderFactory::payment($integration->workspace);
            } else if ($integration->type === 'messaging') {
                $service = \App\Services\IntegrationProviderFactory::messaging($integration->workspace);
            }
            
            $integration->update(['last_check_at' => now(), 'status' => 'active']);
            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            $integration->update(['last_check_at' => now(), 'status' => 'error']);
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
