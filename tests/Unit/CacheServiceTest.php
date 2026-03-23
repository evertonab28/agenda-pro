<?php

namespace Tests\Unit;

use App\Services\CacheService;
use PHPUnit\Framework\TestCase;

class CacheServiceTest extends TestCase
{
    // ──────────────────────────────────────────
    // Key Generation
    // ──────────────────────────────────────────

    public function test_dashboard_key_is_deterministic_for_same_filters()
    {
        $key1 = CacheService::dashboardKey(['from' => '2024-01-01', 'to' => '2024-01-31']);
        $key2 = CacheService::dashboardKey(['from' => '2024-01-01', 'to' => '2024-01-31']);

        $this->assertSame($key1, $key2);
    }

    public function test_dashboard_key_differs_for_different_filters()
    {
        $key1 = CacheService::dashboardKey(['from' => '2024-01-01', 'to' => '2024-01-31']);
        $key2 = CacheService::dashboardKey(['from' => '2024-02-01', 'to' => '2024-02-28']);

        $this->assertNotSame($key1, $key2);
    }

    public function test_dashboard_key_is_order_independent()
    {
        $key1 = CacheService::dashboardKey(['from' => '2024-01-01', 'to' => '2024-01-31']);
        $key2 = CacheService::dashboardKey(['to' => '2024-01-31', 'from' => '2024-01-01']);

        $this->assertSame($key1, $key2);
    }

    public function test_finance_key_is_deterministic_for_same_filters()
    {
        $key1 = CacheService::financeKey(['period' => 'month']);
        $key2 = CacheService::financeKey(['period' => 'month']);

        $this->assertSame($key1, $key2);
    }

    public function test_finance_key_differs_from_dashboard_key()
    {
        $filters = ['period' => 'month'];
        $dashKey = CacheService::dashboardKey($filters);
        $finKey  = CacheService::financeKey($filters);

        $this->assertNotSame($dashKey, $finKey);
    }

    public function test_dashboard_key_has_correct_prefix()
    {
        $key = CacheService::dashboardKey([]);
        $this->assertStringStartsWith('dashboard:', $key);
    }

    public function test_finance_key_has_correct_prefix()
    {
        $key = CacheService::financeKey([]);
        $this->assertStringStartsWith('finance:', $key);
    }

    // ──────────────────────────────────────────
    // TTL values
    // ──────────────────────────────────────────

    public function test_dashboard_ttl_returns_integer()
    {
        $ttl = CacheService::dashboardTtl();
        $this->assertIsInt($ttl);
        $this->assertGreaterThan(0, $ttl);
    }

    public function test_finance_ttl_returns_integer()
    {
        $ttl = CacheService::financeTtl();
        $this->assertIsInt($ttl);
        $this->assertGreaterThan(0, $ttl);
    }
}
