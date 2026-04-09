<?php

namespace App\Observers;

use App\Models\Workspace;
use App\Models\Plan;

class WorkspaceObserver
{
    /**
     * Handle the Workspace "created" event.
     */
    public function created(Workspace $workspace): void
    {
        $plan = Plan::where('slug', 'starter')->first();

        if ($plan) {
            $workspace->subscriptions()->create([
                'plan_id' => $plan->id,
                'status' => 'trialing',
                'trial_ends_at' => now()->addDays(14),
                'starts_at' => now(),
            ]);
        }
    }

    /**
     * Handle the Workspace "updated" event.
     */
    public function updated(Workspace $workspace): void
    {
        //
    }

    /**
     * Handle the Workspace "deleted" event.
     */
    public function deleted(Workspace $workspace): void
    {
        //
    }

    /**
     * Handle the Workspace "restored" event.
     */
    public function restored(Workspace $workspace): void
    {
        //
    }

    /**
     * Handle the Workspace "force deleted" event.
     */
    public function forceDeleted(Workspace $workspace): void
    {
        //
    }
}
