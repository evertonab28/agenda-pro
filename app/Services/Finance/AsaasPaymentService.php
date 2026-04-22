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
        $this->baseUrl = config('services.payment.asaas.url') ?? 'https://sandbox.asaas.com/api/v3';

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

        $response = Http::timeout(10)
            ->retry(2, 500)
            ->withHeaders([
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
            'notes' => json_encode(['invoiceUrl' => $invoiceUrl]),
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
        
        if (empty($customer->document)) {
            throw new \Exception("O cliente \"{$customer->name}\" não possui CPF/CNPJ cadastrado. Edite o cliente e adicione o documento antes de gerar o link.");
        }

        $payload = [
            'name' => $customer->name,
            'email' => $customer->email ?? 'cliente@'.$charge->workspace->slug.'.com',
            'phone' => $customer->phone,
            'cpfCnpj' => $customer->document,
            'externalReference' => (string) $customer->id,
        ];

        $response = Http::timeout(10)
            ->retry(2, 500)
            ->withHeaders([
                'access_token' => $this->apiKey,
            ])->post("{$this->baseUrl}/customers", $payload);

        if ($response->failed()) {
             Log::error("AsaasCustomer: Falha estrita ao criar cliente.", ['response' => $response->json(), 'payload' => $payload]);
             throw new \Exception("Impossível prosseguir: Falha ao providenciar o Customer na API do Asaas.");
        }

        return $response->json('id');
    }

    /**
     * Verify and process a payment link callback. (Webhook payload processing).
     */
    public function processCallback(array $payload): bool
    {
        $externalId = $payload['payment']['id'] ?? $payload['id'] ?? null;
        $status = $payload['payment']['status'] ?? $payload['status'] ?? null;
        $eventName = $payload['event'] ?? ($status === 'paid' ? 'PAYMENT_RECEIVED' : null);

        if (!$externalId || !in_array($eventName, ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'])) {
            return false;
        }

        $charge = Charge::withoutGlobalScopes()
            ->where('payment_provider_id', $externalId)
            ->first();
            
        if ($charge && $charge->status !== 'paid') {
            app(\App\Services\FinanceService::class)->markChargePaid($charge, [
                'method' => 'external',
                'paid_at' => now(),
                'notes' => "Recebimento sintetico via webhook Asaas ({$externalId}).",
            ]);
            Log::info("AsaasPaymentService: Transação {$charge->id} processada com sucessso pelo Worker local", ['external' => $externalId]);
            return true;
        }

        return false;
    }
}
