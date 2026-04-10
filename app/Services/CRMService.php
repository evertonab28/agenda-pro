<?php

namespace App\Services;

use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CRMService
{
    /**
     * Segment a customer based on their activity.
     */
    public function getSegment(Customer $customer): string
    {
        $lastAppointment = $customer->appointments()
            ->where('status', 'completed')
            ->latest('starts_at')
            ->first();

        if (!$lastAppointment) {
            // Se não tem agendamentos e foi criado há mais de 60 dias, tratamos como Inativo
            if ($customer->created_at->lt(now()->subDays(60))) {
                return 'Inativo';
            }
            return 'Novo';
        }

        $daysSinceLastVisit = Carbon::parse($lastAppointment->starts_at)->diffInDays(now());
        $totalCompleted = $customer->appointments()->where('status', 'completed')->count();

        if ($daysSinceLastVisit > 60) {
            return 'Inativo';
        }

        if ($daysSinceLastVisit > 30) {
            return 'Em Risco';
        }

        if ($totalCompleted >= 10) {
            return 'VIP';
        }

        if ($totalCompleted >= 3) {
            return 'Recorrente';
        }

        return 'Ativo';
    }

    /**
     * Get counts for each segment for dashboarding/listing.
     */
    public function getSegmentCounts(): array
    {
        $counts = Customer::select('current_segment', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('current_segment')
            ->pluck('total', 'current_segment')
            ->toArray();

        // Garantir que todas as chaves existam para o frontend
        return array_merge([
            'VIP' => 0,
            'Recorrente' => 0,
            'Ativo' => 0,
            'Em Risco' => 0,
            'Inativo' => 0,
            'Novo' => 0,
        ], array_filter($counts)); // remove nulls se houver
    }

    /**
     * Get customers by segment for campaign targeting.
     */
    public function getCustomersBySegment(string $segment): Collection
    {
        return Customer::where('current_segment', $segment)->get();
    }

    /**
     * Get customer statistics for the dashboard/listing.
     */
    public function getCustomerStats(): array
    {
        $now = now();
        $thirtyDaysAgo = (clone $now)->subDays(30);
        $sixtyDaysAgo = (clone $now)->subDays(60);

        $newThisMonth = Customer::where('created_at', '>=', $thirtyDaysAgo)->count();
        $newLastMonth = Customer::where('created_at', '>=', $sixtyDaysAgo)
            ->where('created_at', '<', $thirtyDaysAgo)
            ->count();
        
        $growth = 0;
        if ($newLastMonth > 0) {
            $growth = round((($newThisMonth - $newLastMonth) / $newLastMonth) * 100);
        } elseif ($newThisMonth > 0) {
            $growth = 100;
        }

        $totalWithApps = Customer::has('appointments')->count();
        $recurring = Customer::has('appointments', '>', 1)->count();
        $retention = $totalWithApps > 0 ? round(($recurring / $totalWithApps) * 100) : 0;

        return [
            'growth' => $growth,
            'retention' => $retention,
            'total_active' => Customer::where('is_active', true)->count(),
        ];
    }

    /**
     * Trigger logic when an appointment is canceled.
     * Notifies the first available customer on the waitlist.
     */
    public function triggerAppointmentCanceled(\App\Models\Appointment $appointment): void
    {
        $waitlistEntry = \App\Models\WaitlistEntry::where('workspace_id', $appointment->workspace_id)
            ->where('service_id', $appointment->service_id)
            ->where('status', \App\Enums\WaitlistStatus::Waiting)
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'asc')
            ->first();

        if ($waitlistEntry) {
            try {
                // Notify customer (via specific workspace messaging service)
                $messaging = \App\Services\IntegrationProviderFactory::messaging($appointment->workspace);
                $messaging->send(
                    $waitlistEntry->customer->phone,
                    "Olá {$waitlistEntry->customer->name}! Um horário acaba de vagar para o serviço {$appointment->service->name}. Tem interesse? Responda SIM."
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('CRM: Não foi possível notificar cliente da lista de espera via mensageria.', [
                    'workspace_id' => $appointment->workspace_id,
                    'waitlist_entry_id' => $waitlistEntry->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $waitlistEntry->update(['status' => \App\Enums\WaitlistStatus::Called]);
        }
    }

    /**
     * Identify inactive customers and suggest re-engagement.
     */
    public function reengageInactiveCustomers(int $clinicId): array
    {
        return Customer::where('workspace_id', $clinicId)
            ->where('is_active', true)
            ->where('current_segment', 'Inativo')
            ->get()
            ->toArray();
    }

    /**
     * Get financial summary for a customer.
     */
    public function getCustomerSummary(Customer $customer): array
    {
        return [
            'total_paid' => $customer->receipts()->sum('amount_received'),
            'total_pending' => $customer->charges()->where('status', 'pending')->sum('amount'),
            'total_overdue' => $customer->charges()->where('status', 'overdue')->sum('amount'),
        ];
    }
}
