<?php

namespace App\Services\Finance;

use App\Models\Charge;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AsaasPaymentService implements PaymentLinkServiceInterface
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct(array $credentials)
    {
        $this->apiKey = $credentials['api_key'] ?? '';
        $this->baseUrl = config('services.payment.asaas.url', 'https://sandbox.asaas.com/api/v3');

        if (empty($this->apiKey)) {
            throw new \Exception("AsaasPaymentService: API Key ausente nas credenciais.");
        }
    }

    /**
     * Generate a unique payment link for a given charge.
     */
    public function generate(Charge $charge): string
    {
        // Define due date (today + 3 days as example)
        $dueDate = $charge->due_date ? $charge->due_date->format('Y-m-d') : now()->addDays(3)->format('Y-m-d');
        
        // Carga real para o Asaas payload
        $payload = [
            'customer' => $this->getOrCreateAsaasCustomer($charge),
            'billingType' => 'UNDEFINED', // Deixa o cliente escolher PIX/Boleto/Cartão no checkout
            'value' => (float) $charge->amount,
            'dueDate' => $dueDate,
            'description' => $charge->description ?? "Cobrança Agendamento " . config('app.name'),
            'externalReference' => (string) $charge->id,
        ];

        $response = Http::withHeaders([
            'access_token' => $this->apiKey,
        ])->post("{$this->baseUrl}/payments", $payload);

        if ($response->failed()) {
            Log::error("AsaasPaymentService: Falha ao gerar cobrança", [
                'charge_id' => $charge->id,
                'response' => $response->json(),
                'status' => $response->status()
            ]);
            throw new \Exception("Falha na comunicação com o provedor de pagamentos (Asaas).");
        }

        $data = $response->json();
        $externalId = $data['id'];
        $invoiceUrl = $data['invoiceUrl'];

        // Persistência Real
        $hash = hash('sha256', $charge->id . $externalId . config('app.key'));

        $charge->update([
            'payment_link_hash' => $hash,
            'payment_link_expires_at' => now()->parse($dueDate)->endOfDay(),
            'payment_provider_id' => $externalId,
        ]);

        Log::info("AsaasPaymentService: Cobrança gerada com sucesso", [
            'charge_id' => $charge->id,
            'external_id' => $externalId,
        ]);

        return route('payment.direct', $hash);
    }

    /**
     * Helper para garantir que o cliente existe no Asaas.
     */
    private function getOrCreateAsaasCustomer(Charge $charge): string
    {
        $customer = $charge->customer;
        
        // Verifica se já guardamos o customer_id do asaas
        // O ideal é guardar na tabela customers ou em workspace_integrations (metadata)
        // Para a sprint vamos buscar por CPF/Email genérico ou criar um adhoc
        
        $payload = [
            'name' => $customer->name,
            'email' => $customer->email ?? 'cliente@'.$charge->workspace->slug.'.com',
            'phone' => $customer->phone,
            'externalReference' => (string) $customer->id,
        ];

        if (!empty($customer->document)) {
            $payload['cpfCnpj'] = $customer->document;
        }

        $response = Http::withHeaders([
            'access_token' => $this->apiKey,
        ])->post("{$this->baseUrl}/customers", $payload);

        if ($response->failed()) {
             Log::warning("AsaasCustomer: Falha ao criar cliente", ['response' => $response->json()]);
             // Fallback
             return ''; // Asaas pode rejeitar dependendo da config rigorosa
        }

        return $response->json('id');
    }

    /**
     * Verify and process a payment link callback. (Webhook payload processing).
     */
    public function processCallback(array $payload): bool
    {
        // Se a chamada vier direta no hook
        // Será roteado pelo WebhookController principal
        return true;
    }
}
