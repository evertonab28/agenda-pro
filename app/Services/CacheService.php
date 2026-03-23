<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class CacheService
{
    /**
     * Generate a deterministic cache key for dashboard data.
     */
    public static function dashboardKey(array $filters = []): string
    {
        ksort($filters);
        return 'dashboard:' . md5(serialize($filters));
    }

    /**
     * Generate a deterministic cache key for finance data.
     */
    public static function financeKey(array $filters = []): string
    {
        ksort($filters);
        return 'finance:' . md5(serialize($filters));
    }

    /**
     * Forget all cache keys matching a prefix pattern.
     * Uses Cache tags if the driver supports it (Redis), otherwise
     * falls back to incrementing a version key (cache busting).
     */
    public static function invalidateDashboard(): void
    {
        Cache::increment('dashboard_version');
    }

    public static function invalidateFinance(): void
    {
        Cache::increment('finance_version');
    }

    /**
     * Get TTL in seconds from env.
     */
    public static function dashboardTtl(): int
    {
        return (int) env('DASHBOARD_CACHE_TTL', 120);
    }

    public static function financeTtl(): int
    {
        return (int) env('FINANCE_CACHE_TTL', 120);
    }

    /**
     * Remember with dashboard versioning (auto-busted on invalidation).
     */
    public static function rememberDashboard(array $filters, \Closure $callback): mixed
    {
        $version = Cache::get('dashboard_version', 1);
        $key = self::dashboardKey(array_merge($filters, ['_v' => $version]));
        return Cache::remember($key, self::dashboardTtl(), $callback);
    }

    public static function rememberFinance(array $filters, \Closure $callback): mixed
    {
        $version = Cache::get('finance_version', 1);
        $key = self::financeKey(array_merge($filters, ['_v' => $version]));
        return Cache::remember($key, self::financeTtl(), $callback);
    }
}
