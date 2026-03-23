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
}
