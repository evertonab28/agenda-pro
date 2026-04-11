<?php

namespace App\Services\Retention;

use App\Models\WorkspaceBillingInvoice;
use App\Models\WorkspaceSubscriptionEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\DTOs\SaaS\CommercialEventPayload;

class DunningService
{
    /**
     * Processa todos os lembretes do ciclo de vida da fatura.
     */
    public function processReminders(): array
    {
        $processed = [
            'upcoming' => 0,
            'due_today' => 0,
            'overdue' => 0,
        ];

        DB::transaction(function () use (&$processed) {
            $processed['upcoming'] = $this->sendUpcomingReminders();
            $processed['due_today'] = $this->sendDueTodayReminders();
            $processed['overdue'] = $this->sendOverdueReminders();
        });

        return $processed;
    }

    private function sendUpcomingReminders(): int
    {
        $count = 0;
        // Invoices pendentes vencendo em 3 a 5 dias (aqui fixamos 3 para facilitar o cron)
        $invoices = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('status', 'pending')
            ->whereNotNull('due_date')
            ->whereDate('due_date', now()->addDays(3)->toDateString())
            ->get();

        foreach ($invoices as $invoice) {
            if ($this->hasSentReminder($invoice, 'upcoming')) continue;

            $this->recordReminder($invoice, 'upcoming');
            // InvoiceReminderSent event dispatched inside recordReminder() → handled by SendCommercialNotification
            $count++;
        }

        return $count;
    }

    private function sendDueTodayReminders(): int
    {
        $count = 0;
        $invoices = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('status', 'pending')
            ->whereNotNull('due_date')
            ->whereDate('due_date', now()->toDateString())
            ->get();

        foreach ($invoices as $invoice) {
            if ($this->hasSentReminder($invoice, 'due_today')) continue;

            $this->recordReminder($invoice, 'due_today');
            // InvoiceReminderSent event dispatched inside recordReminder() → handled by SendCommercialNotification
            $count++;
        }

        return $count;
    }

    private function sendOverdueReminders(): int
    {
        $count = 0;
        // Invoices vencidas há exatos 3 dias ou continuam vencidas e não enviamos aviso
        $invoices = WorkspaceBillingInvoice::withoutGlobalScopes()
            ->where('status', 'overdue')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->get();

        foreach ($invoices as $invoice) {
            // Em caso de overdue, verificar se já enviamos pelo menos um lembrete overdue
            // (Na vida real poderíamos enviar overdue_1, overdue_2, mas vamos manter básico)
            if ($this->hasSentReminder($invoice, 'overdue')) continue;

            $this->recordReminder($invoice, 'overdue');
            // InvoiceReminderSent event dispatched inside recordReminder() → handled by SendCommercialNotification
            $count++;
        }

        return $count;
    }

    private function hasSentReminder(WorkspaceBillingInvoice $invoice, string $type): bool
    {
        return WorkspaceSubscriptionEvent::withoutGlobalScopes()
            ->where('workspace_id', $invoice->workspace_id)
            ->where('subscription_id', $invoice->subscription_id)
            ->where('event_type', 'reminder_sent')
            ->whereJsonContains('payload->invoice_id', $invoice->id)
            ->whereJsonContains('payload->reminder_type', $type)
            ->exists();
    }

    private function recordReminder(WorkspaceBillingInvoice $invoice, string $type): void
    {
        event(new \App\Events\SaaS\InvoiceReminderSent(new CommercialEventPayload(
            workspaceId: $invoice->workspace_id,
            subscriptionId: $invoice->subscription_id,
            invoiceId: $invoice->id,
            planId: $invoice->plan_id,
            amount: (float) $invoice->amount,
            meta: [
                'reminder_type' => $type, // upcoming, due_today, overdue
                'due_date' => $invoice->due_date?->toDateString(),
            ]
        )));
    }
}
