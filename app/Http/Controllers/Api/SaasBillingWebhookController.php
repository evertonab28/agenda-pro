<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkspaceBillingInvoice;
use App\Services\Billing\WorkspaceBillingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SaasBillingWebhookController extends Controller
{
    public function __construct(
        protected WorkspaceBillingService $billingService
    ) {}

    public function handle(Request $request)
    {
        try {
            // Simple token validation (Asaas sends customized header if configured, 
            // or we check the payload. For now, we'll use a secret in env)
            $token = $request->header('asaas-access-token');
            if ($token !== config('services.payment.asaas.webhook_token')) {
                Log::warning("SaasBillingWebhook: Token inválido recebido.");
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $payload = $request->all();
            $event = $payload['event'] ?? null;
            $payment = $payload['payment'] ?? null;

            if (!$event || !$payment) {
                return response()->json(['error' => 'Malformed payload'], 400);
            }

            Log::info("SaasBillingWebhook: Processando evento {$event}", ['payment_id' => $payment['id']]);

            // Find invoice by provider_invoice_id
            $invoice = WorkspaceBillingInvoice::where('provider_invoice_id', $payment['id'])->first();

            if (!$invoice) {
                Log::warning("SaasBillingWebhook: Fatura não encontrada no banco local", ['id' => $payment['id']]);
                return response()->json(['status' => 'ignored'], 200);
            }

            switch ($event) {
                case 'PAYMENT_RECEIVED':
                case 'PAYMENT_CONFIRMED':
                    $this->billingService->confirmPayment($invoice);
                    break;

                case 'PAYMENT_OVERDUE':
                    $invoice->update(['status' => 'overdue']);
                    // Logic for blocking workspace could be here or in a job
                    $invoice->workspace->subscription()->first()?->update(['status' => 'overdue']);
                    break;

                case 'PAYMENT_DELETED':
                    $invoice->update(['status' => 'canceled']);
                    break;
            }

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            Log::error("SaasBillingWebhook Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }
}
