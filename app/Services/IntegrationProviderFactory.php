<?php

namespace App\Services;

use App\Models\Workspace;
use App\Models\WorkspaceIntegration;
use App\Services\Finance\PaymentLinkServiceInterface;
use App\Services\Messaging\MessagingServiceInterface;

class IntegrationProviderFactory
{
    /**
     * Resolve the Payment implementation for a specific Workspace.
     */
    public static function payment(Workspace $workspace): PaymentLinkServiceInterface
    {
        $integration = WorkspaceIntegration::where('workspace_id', $workspace->id)
            ->where('type', 'payment')
            ->where('status', 'active')
            ->first();

        if (!$integration) {
            throw new \Exception("Nenhuma integração de pagamento configurada para o Workspace {$workspace->name}");
        }

        switch ($integration->provider) {
            case 'asaas':
                return app(\App\Services\Finance\AsaasPaymentService::class, ['credentials' => $integration->credentials]);
            default:
                throw new \Exception("Provider de pagamento {$integration->provider} não suportado.");
        }
    }

    /**
     * Resolve the Messaging implementation for a specific Workspace.
     */
    public static function messaging(Workspace $workspace): MessagingServiceInterface
    {
        $integration = WorkspaceIntegration::where('workspace_id', $workspace->id)
            ->where('type', 'messaging')
            ->where('status', 'active')
            ->first();

        if (!$integration) {
            throw new \Exception("Nenhuma integração de mensageria configurada para o Workspace {$workspace->name}");
        }

        switch ($integration->provider) {
            case 'whatsapp':
            case 'evolution':
                return app(\App\Services\Messaging\EvolutionWhatsAppService::class, ['credentials' => $integration->credentials]);
            default:
                throw new \Exception("Provider de mensageria {$integration->provider} não suportado.");
        }
    }
}
