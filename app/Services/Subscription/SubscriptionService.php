<?php

namespace App\Services\Subscription;

use App\Models\Workspace;
use App\Models\Plan;

class SubscriptionService
{
    /**
     * Check if a feature is enabled for the workspace.
     */
    public function canUseFeature(Workspace $workspace, string $feature): bool
    {
        $subscription = $workspace->subscription()->first();

        if (!$subscription || !$subscription->isActive()) {
            return false;
        }

        $features = $subscription->plan->features;
        if (is_string($features)) {
            $features = json_decode($features, true);
        }

        return (bool) ($features[$feature] ?? false);
    }

    /**
     * Get a specific limit value for the workspace.
     */
    public function getLimit(Workspace $workspace, string $limit, $default = 0)
    {
        $subscription = $workspace->subscription()->first();

        if (!$subscription || !$subscription->isActive()) {
            return $default;
        }

        $features = $subscription->plan->features ?? [];
        return $features[$limit] ?? $default;
    }

    /**
     * Check if workspace can add a resource based on count.
     */
    public function canAddResource(Workspace $workspace, string $limit, int $currentCount): bool
    {
        $max = $this->getLimit($workspace, $limit, 0);
        return $currentCount < $max;
    }

    /**
     * Check if workspace has access to a specific integration provider.
     */
    public function canAccessIntegration(Workspace $workspace, string $provider): bool
    {
        $allowed = $this->getLimit($workspace, 'integrations_access', []);
        return in_array($provider, $allowed);
    }
}
