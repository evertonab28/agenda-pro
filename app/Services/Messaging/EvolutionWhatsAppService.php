<?php

namespace App\Services\Messaging;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionWhatsAppService implements MessagingServiceInterface
{
    private string $apiKey;
    private string $instanceName;
    private string $baseUrl;

    public function __construct(array $credentials)
    {
        $this->apiKey = $credentials['api_key'] ?? '';
        $this->instanceName = $credentials['instance_name'] ?? '';
        $this->baseUrl = $credentials['base_url'] ?? config('services.messaging.evolution.url', 'http://evolution-api:8080');

        if (empty($this->apiKey) || empty($this->instanceName)) {
            throw new \Exception("EvolutionWhatsAppService: Credenciais incompletas (apiKey, instance_name).");
        }
    }

    /**
     * Send a real message via Evolution API.
     */
    public function send(string $to, string $message, array $meta = []): array
    {
        // Format number (Brazil format standardizing wrapper)
        $cleanNumber = preg_replace('/\D/', '', $to);
        if (strlen($cleanNumber) == 10 || strlen($cleanNumber) == 11) {
            $cleanNumber = "55" . $cleanNumber;
        }

        $payload = [
            'number' => $cleanNumber,
            'options' => [
                'delay' => 1200, // humanized delay ms
                'presence' => 'composing'
            ],
            'textMessage' => [
                'text' => $message
            ]
        ];

        $response = Http::timeout(10)
            ->withHeaders([
                'apikey' => $this->apiKey,
            ])->post("{$this->baseUrl}/message/sendText/{$this->instanceName}", $payload);

        if ($response->failed()) {
            $status = $response->status();
            $errorType = match(true) {
                $status === 401 || $status === 403 => 'Autenticação Inválida/Não Autorizado',
                $status === 422 => 'Número Inválido (422)',
                $status >= 500 => 'Indisponibilidade do Provedor (500)',
                default => 'Erro de Comunicação'
            };

            Log::error("EvolutionWhatsAppService: {$errorType}", [
                'to' => $to,
                'status' => $status,
                'response' => $response->json(),
                'meta' => $meta,
            ]);
            return ['ok' => false, 'error' => $errorType];
        }

        $data = $response->json();
        
        // Em APIs do wpp como Evolution, o messageId é recebido para track de delivery
        $externalId = $data['key']['id'] ?? ('msg_evolution_' . uniqid());

        Log::info("EvolutionWhatsAppService: Message Sent", [
            'to' => $to,
            'external_id' => $externalId,
            'instance' => $this->instanceName,
        ]);

        return [
            'ok' => true,
            'id' => $externalId,
            'status' => 'sent',
        ];
    }
}
