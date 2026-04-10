<?php

namespace App\Listeners\SaaS;

use App\Events\SaaS\CommercialEvent;
use App\Events\SaaS\InvoicePaid;
use App\Events\SaaS\InvoiceOverdue;
use App\Events\SaaS\InvoiceGenerated;
use App\Events\SaaS\SubscriptionActivated;
use App\Events\SaaS\InvoiceReminderSent;
use App\Services\Messaging\MessagingServiceInterface;
use App\Models\Workspace;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendCommercialNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected MessagingServiceInterface $messagingService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(CommercialEvent $event): void
    {
        try {
            $workspace = Workspace::withoutGlobalScopes()->find($event->payload->workspaceId);
            if (!$workspace) return;

            $recipient = $workspace->users()->first()?->email ?? "admin@{$workspace->slug}.com";
            $message = $this->resolveMessage($event);

            if ($message) {
                $this->messagingService->send($recipient, $message, [
                    'workspace_id' => $event->payload->workspaceId,
                    'event_type'   => $event->getEventType(),
                ]);
                
                Log::info("CommercialNotificationSent: {$event->getEventType()} to {$recipient}");
            }
        } catch (\Exception $e) {
            Log::error("Failed to send commercial notification: {$e->getMessage()}", [
                'event' => get_class($event),
                'workspace_id' => $event->payload->workspaceId
            ]);
        }
    }

    protected function resolveMessage(CommercialEvent $event): ?string
    {
        return match (true) {
            $event instanceof SubscriptionActivated => "Bem-vindo ao Agenda Pro! Sua assinatura foi ativada com sucesso.",
            $event instanceof InvoicePaid           => "Obrigado! Recebemos o pagamento da sua fatura no valor de R$ " . number_format($event->payload->amount, 2, ',', '.'),
            $event instanceof InvoiceGenerated      => "Uma nova fatura foi gerada para o seu workspace. Link para pagamento: " . ($event->payload->meta['payment_link'] ?? 'Painel de Assinatura'),
            $event instanceof InvoiceOverdue        => "Atenção: Sua fatura está vencida. Regularize sua situação para evitar a suspensão dos serviços.",
            $event instanceof InvoiceReminderSent   => "Lembrete: Você possui uma fatura pendente com vencimento em " . ($event->payload->meta['due_date'] ?? 'breve'),
            default => null,
        };
    }
}
