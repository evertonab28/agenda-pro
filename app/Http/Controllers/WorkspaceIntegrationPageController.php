<?php

namespace App\Http\Controllers;

use App\Models\WorkspaceIntegration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceIntegrationPageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('manage-settings');

        $integrations = WorkspaceIntegration::where('workspace_id', $request->user()->workspace_id)
            ->get()
            ->map(function ($integration) {
                // Remove credenciais sensíveis antes de enviar para o front
                // Mas mantém as chaves presentes para o front saber o que existe
                $safeCredentials = [];
                if (!empty($integration->credentials)) {
                    foreach ($integration->credentials as $key => $value) {
                        $safeCredentials[$key] = '********';
                    }
                }

                return [
                    'id' => $integration->id,
                    'type' => $integration->type,
                    'provider' => $integration->provider,
                    'status' => $integration->status,
                    'last_check_at' => $integration->last_check_at,
                    'credentials' => $safeCredentials,
                ];
            });

        return Inertia::render('Configurations/Integrations/Index', [
            'integrations' => $integrations
        ]);
    }
}
