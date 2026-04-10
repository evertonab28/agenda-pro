<?php

namespace App\Services\Billing;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\DTOs\SaaS\BillingWorkspaceDTO;
use App\DTOs\Integration\AsaasPaymentDTO;

class AsaasSaasProvider
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.payment.asaas.key') ?? '';
        $this->baseUrl = config('services.payment.asaas.url') ?? 'https://sandbox.asaas.com/api/v3';

        if (empty($this->apiKey)) {
            Log::warning("AsaasSaasProvider: API Key do SaaS não configurada.");
        }
    }

    /**
     * Get or create a customer in Asaas for the workspace.
     */
    public function getOrCreateCustomer(BillingWorkspaceDTO $workspaceData): string
    {
        // No SaaS billing, the workspace is the customer.
        $payload = [
            'name' => $workspaceData->name,
            'email' => $workspaceData->email ?? 'admin@' . $workspaceData->slug . '.com',
            'externalReference' => (string) $workspaceData->id,
        ];

        if (!empty($workspaceData->document)) {
            $payload['cpfCnpj'] = $workspaceData->document;
        }

        $response = Http::withHeaders([
            'access_token' => $this->apiKey,
        ])->post("{$this->baseUrl}/customers", $payload);

        if ($response->failed()) {
            // Check if already exists by externalReference or email?
            // For now, retry with search if fail or just throw
            Log::error("AsaasSaasProvider: Erro ao criar cliente", ['response' => $response->json()]);
            throw new \Exception("Erro ao processar cliente no Asaas.");
        }

        return $response->json('id');
    }

    /**
     * Create a single payment (charge) for a workspace.
     */
    public function createPayment(string $customerId, float $amount, string $dueDate, string $description, string $externalReference): AsaasPaymentDTO
    {
        $payload = [
            'customer' => $customerId,
            'billingType' => 'UNDEFINED',
            'value' => $amount,
            'dueDate' => $dueDate,
            'description' => $description,
            'externalReference' => $externalReference,
        ];

        $response = Http::withHeaders([
            'access_token' => $this->apiKey,
        ])->post("{$this->baseUrl}/payments", $payload);

        if ($response->failed()) {
            Log::error("AsaasSaasProvider: Erro ao criar pagamento", ['response' => $response->json()]);
            throw new \Exception("Erro ao gerar cobrança no Asaas.");
        }

        return AsaasPaymentDTO::fromAsaasResponse($response->json());
    }
}
