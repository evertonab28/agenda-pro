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
            ->where('status', 'finished')
            ->latest('starts_at')
            ->first();

        if (!$lastAppointment) {
            return 'Novo';
        }

        $daysSinceLastVisit = Carbon::parse($lastAppointment->starts_at)->diffInDays(now());
        $totalFinished = $customer->appointments()->where('status', 'finished')->count();

        if ($daysSinceLastVisit > 60) {
            return 'Inativo';
        }

        if ($daysSinceLastVisit > 30) {
            return 'Em Risco';
        }

        if ($totalFinished >= 10) {
            return 'VIP';
        }

        if ($totalFinished >= 3) {
            return 'Recorrente';
        }

        return 'Ativo';
    }

    /**
     * Get counts for each segment for dashboarding/listing.
     */
    public function getSegmentCounts(): array
    {
        $customers = Customer::all();
        $segments = [
            'VIP' => 0,
            'Recorrente' => 0,
            'Ativo' => 0,
            'Em Risco' => 0,
            'Inativo' => 0,
            'Novo' => 0,
        ];

        foreach ($customers as $customer) {
            $segment = $this->getSegment($customer);
            $segments[$segment]++;
        }

        return $segments;
    }

    /**
     * Get customers by segment for campaign targeting.
     */
    public function getCustomersBySegment(string $segment): Collection
    {
        return Customer::all()->filter(function ($customer) use ($segment) {
            return $this->getSegment($customer) === $segment;
        });
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
        $waitlistEntry = \App\Models\WaitlistEntry::where('clinic_id', $appointment->clinic_id)
            ->where('service_id', $appointment->service_id)
            ->where('status', \App\Enums\WaitlistStatus::Waiting)
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'asc')
            ->first();

        if ($waitlistEntry) {
            // Notify customer (via stub messaging service for now)
            $messaging = app(\App\Services\Messaging\MessagingServiceInterface::class);
            $messaging->send(
                $waitlistEntry->customer->phone,
                "Olá {$waitlistEntry->customer->name}! Um horário acaba de vagar para o serviço {$appointment->service->name}. Tem interesse? Responda SIM."
            );

            $waitlistEntry->update(['status' => \App\Enums\WaitlistStatus::Called]);
        }
    }

    /**
     * Identify inactive customers and suggest re-engagement.
     */
    public function reengageInactiveCustomers(int $clinicId): array
    {
        $cutoff = now()->subDays(60);
        
        // Find customers whose last FINISHED appointment was more than 60 days ago
        // OR who have NO finished appointments but were created > 60 days ago.
        return Customer::where('clinic_id', $clinicId)
            ->where('is_active', true)
            ->get()
            ->filter(function ($customer) use ($cutoff) {
                $lastApp = $customer->appointments()
                    ->where('status', 'finished')
                    ->latest('starts_at')
                    ->first();
                
                if (!$lastApp) {
                    return $customer->created_at->lt($cutoff);
                }
                
                return Carbon::parse($lastApp->starts_at)->lt($cutoff);
            })
            ->values()
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
