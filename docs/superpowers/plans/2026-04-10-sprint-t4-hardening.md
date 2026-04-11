# Sprint T4 — Final Hardening & Schema Safety

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute focused hardening sprint fixing migration down() safety, workspace_id isolation in financial tables, TrialConversionService constructor bug, and TrialEndingSoon notification gap.

**Architecture:** All fixes are backwards-compatible with production environments. Migrations use nullable columns with backfill, code fixes are contained to single files, documentation updates reflect the real state of the system.

**Tech Stack:** Laravel 11, PHP 8.2, SQLite (tests), MySQL (prod), PHPUnit

---

## Mini Audit — Findings & Decisions

### Issues identified

| # | Issue | Severity | Decision |
|---|-------|----------|----------|
| A | 3 migrations with broken `down()`: `add_clinic_id_to_core_tables`, `add_clinic_id_to_remaining_core_tables`, `add_clinic_id_to_receipts_table` | MEDIUM | Document — cannot edit historic migrations already in prod. Document in migration-audit.md + CI guideline. |
| B | 1 empty migration: `2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php` | LOW | Add explanatory comment. Document in migration-audit.md. |
| C | 5 migrations with duplicate timestamps (2026_03_22_024705 x2, 2026_03_22_024706 x3) | LOW | Benign — alphabetical ordering, no FK dependency between those tables. Document only. |
| D | `wallets`, `wallet_transactions`, `customer_packages` have no `workspace_id` | CRITICAL | Create new migration to add + backfill + index. Update models. |
| E | `TrialConversionService::recordAlert()` passes named args directly to `TrialEndingSoon` instead of wrapping in `CommercialEventPayload` | CRITICAL | Fix constructor call. Add test. |
| F | `SendCommercialNotification` does not handle `TrialEndingSoon` event | HIGH | Add case to `resolveMessage()` and register listener in `CommercialServiceProvider`. |
| G | `DunningService` has 3 misleading `// TODO: call Notification service` comments | MEDIUM | Notifications ARE sent via event system. Remove TODOs, add clarifying comment. |

### Items chosen for T4 (all of the above)

- **A, B, C**: Documentation only (safe, already in prod)
- **D**: New migration + model update (safe, additive)
- **E**: Code fix in 1 method (clear bug, critical path)
- **F**: Add listener registration + resolve case (2-file change)
- **G**: Comment cleanup in DunningService (1-file change)

---

## Task 1: Document broken `down()` methods and empty migration

**Files:**
- Modify: `database/migrations/2026_03_23_231245_add_clinic_id_to_core_tables.php`
- Modify: `database/migrations/2026_03_23_231933_add_clinic_id_to_remaining_core_tables.php`
- Modify: `database/migrations/2026_03_23_233136_add_clinic_id_to_receipts_table.php`
- Modify: `database/migrations/2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php`

- [ ] **Step 1: Add safety comment to `add_clinic_id_to_core_tables.php` down()**

Replace the `down()` method in `database/migrations/2026_03_23_231245_add_clinic_id_to_core_tables.php`:

```php
    public function down(): void
    {
        // WARNING (Sprint T4): This down() is intentionally incomplete.
        // The up() added clinic_id to users, customers, appointments, charges.
        // Rolling back these columns requires manual intervention — this migration
        // was committed to production before down() was fully implemented.
        //
        // DO NOT use migrate:rollback past this point in any environment with data.
        // In ephemeral environments (CI/CD), use `migrate:fresh` instead.
        //
        // Ref: docs/db/migration-audit.md — "Migrations com down() incompleto"
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
```

- [ ] **Step 2: Add safety comment to `add_clinic_id_to_remaining_core_tables.php` down()**

Replace the `down()` method in `database/migrations/2026_03_23_231933_add_clinic_id_to_remaining_core_tables.php`:

```php
    public function down(): void
    {
        // WARNING (Sprint T4): This down() references a non-existent table name
        // ('remaining_core_tables') — it was a placeholder that was never corrected.
        // Running migrate:rollback past this migration will throw a schema error.
        //
        // The up() added clinic_id to: services, professionals, packages.
        //
        // DO NOT use migrate:rollback past this point in any environment with data.
        // In ephemeral environments (CI/CD), use `migrate:fresh` instead.
        //
        // Ref: docs/db/migration-audit.md — "Migrations com down() incompleto"
        Schema::table('remaining_core_tables', function (Blueprint $table) {
            //
        });
    }
```

- [ ] **Step 3: Add safety comment to `add_clinic_id_to_receipts_table.php` down()**

Replace the `down()` method in `database/migrations/2026_03_23_233136_add_clinic_id_to_receipts_table.php`:

```php
    public function down(): void
    {
        // WARNING (Sprint T4): This down() has an empty body — it does not drop
        // the clinic_id column added in up(). Rolling back will leave clinic_id
        // in the receipts table.
        //
        // DO NOT use migrate:rollback past this point in any environment with data.
        // In ephemeral environments (CI/CD), use `migrate:fresh` instead.
        //
        // Ref: docs/db/migration-audit.md — "Migrations com down() incompleto"
        Schema::table('receipts', function (Blueprint $table) {
            //
        });
    }
```

- [ ] **Step 4: Add explanatory comment to empty migration**

Replace the `up()` in `database/migrations/2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php`:

```php
    public function up(): void
    {
        // Este arquivo é um placeholder vazio commitado acidentalmente.
        // Os campos de retenção foram adicionados em migrations posteriores:
        //   - 2026_04_09_175548: cancellation_category, cancellation_reason, winback_candidate
        //   - 2026_04_09_151108: cancellation_recorded_at, canceled_by
        //
        // NÃO ALTERAR — já foi registrado no histórico de migrations de todos os ambientes.
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            //
        });
    }
```

Also update `down()` to match:

```php
    public function down(): void
    {
        // Placeholder vazio — nada a reverter. Ver comentário em up().
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            //
        });
    }
```

- [ ] **Step 5: Commit**

```bash
git add database/migrations/2026_03_23_231245_add_clinic_id_to_core_tables.php
git add database/migrations/2026_03_23_231933_add_clinic_id_to_remaining_core_tables.php
git add database/migrations/2026_03_23_233136_add_clinic_id_to_receipts_table.php
git add database/migrations/2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php
git commit -m "docs(migrations): add safety comments to broken down() and empty migration"
```

---

## Task 2: Fix TrialConversionService constructor bug

**Files:**
- Modify: `app/Services/Retention/TrialConversionService.php`

**Bug:** `recordAlert()` at line 65 calls `event(new TrialEndingSoon(workspaceId: ..., subscriptionId: ..., ...))` passing named args directly. But `TrialEndingSoon` extends `CommercialEvent` which requires `CommercialEventPayload $payload` as its only constructor argument. This throws a `TypeError` at runtime.

- [ ] **Step 1: Write the failing test first**

Create `tests/Unit/Services/TrialConversionServiceTest.php`:

```php
<?php

namespace Tests\Unit\Services;

use App\DTOs\SaaS\CommercialEventPayload;
use App\Events\SaaS\TrialEndingSoon;
use App\Models\Plan;
use App\Models\Workspace;
use App\Models\WorkspaceSubscription;
use App\Services\Retention\TrialConversionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class TrialConversionServiceTest extends TestCase
{
    use RefreshDatabase;

    private TrialConversionService $service;
    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TrialConversionService();
        $this->plan = Plan::create([
            'name'          => 'Pro',
            'slug'          => 'pro',
            'price'         => 99.90,
            'billing_cycle' => 'monthly',
            'is_active'     => true,
            'features'      => [],
        ]);
    }

    public function test_fires_trial_ending_soon_with_valid_commercial_event_payload()
    {
        Event::fake([TrialEndingSoon::class]);

        $ws = Workspace::create(['name' => 'Trial WS', 'slug' => 'trial-ws']);
        WorkspaceSubscription::create([
            'workspace_id'   => $ws->id,
            'plan_id'        => $this->plan->id,
            'status'         => 'trialing',
            'trial_ends_at'  => now()->addDays(7)->toDateString(),
            'starts_at'      => now(),
        ]);

        $result = $this->service->processTrialAlerts();

        $this->assertEquals(1, $result['7_days']);

        Event::assertDispatched(TrialEndingSoon::class, function (TrialEndingSoon $event) use ($ws) {
            return $event->payload instanceof CommercialEventPayload
                && $event->payload->workspaceId === $ws->id
                && ($event->payload->meta['days_left'] ?? null) === 7;
        });
    }

    public function test_does_not_resend_alert_already_recorded()
    {
        $ws = Workspace::create(['name' => 'Trial WS2', 'slug' => 'trial-ws2']);
        WorkspaceSubscription::create([
            'workspace_id'  => $ws->id,
            'plan_id'       => $this->plan->id,
            'status'        => 'trialing',
            'trial_ends_at' => now()->addDays(3)->toDateString(),
            'starts_at'     => now(),
        ]);

        $result1 = $this->service->processTrialAlerts();
        $this->assertEquals(1, $result1['3_days']);

        $result2 = $this->service->processTrialAlerts();
        $this->assertEquals(0, $result2['3_days']);
    }

    public function test_processes_all_three_alert_thresholds()
    {
        $makeWs = fn(string $slug) => Workspace::create(['name' => $slug, 'slug' => $slug]);

        $ws7 = $makeWs('t-7d');
        WorkspaceSubscription::create([
            'workspace_id' => $ws7->id, 'plan_id' => $this->plan->id,
            'status' => 'trialing', 'trial_ends_at' => now()->addDays(7)->toDateString(),
            'starts_at' => now(),
        ]);

        $ws3 = $makeWs('t-3d');
        WorkspaceSubscription::create([
            'workspace_id' => $ws3->id, 'plan_id' => $this->plan->id,
            'status' => 'trialing', 'trial_ends_at' => now()->addDays(3)->toDateString(),
            'starts_at' => now(),
        ]);

        $ws0 = $makeWs('t-0d');
        WorkspaceSubscription::create([
            'workspace_id' => $ws0->id, 'plan_id' => $this->plan->id,
            'status' => 'trialing', 'trial_ends_at' => now()->toDateString(),
            'starts_at' => now(),
        ]);

        $result = $this->service->processTrialAlerts();

        $this->assertEquals(1, $result['7_days']);
        $this->assertEquals(1, $result['3_days']);
        $this->assertEquals(1, $result['today']);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
php artisan test tests/Unit/Services/TrialConversionServiceTest.php --filter test_fires_trial_ending_soon_with_valid_commercial_event_payload
```

Expected: FAIL — `TypeError: Unknown named argument $workspaceId` (or similar constructor mismatch)

- [ ] **Step 3: Fix `recordAlert()` in `TrialConversionService`**

In `app/Services/Retention/TrialConversionService.php`, replace the entire `recordAlert` method (lines 63–76):

```php
    private function recordAlert(WorkspaceSubscription $sub, int $daysLeft): void
    {
        event(new \App\Events\SaaS\TrialEndingSoon(
            new \App\DTOs\SaaS\CommercialEventPayload(
                workspaceId: $sub->workspace_id,
                subscriptionId: $sub->id,
                planId: $sub->plan_id,
                meta: [
                    'days_left'      => $daysLeft,
                    'trial_ends_at'  => $sub->trial_ends_at?->toDateString(),
                ]
            )
        ));

        Log::info("TrialOps: sent {$daysLeft}_days alert for workspace {$sub->workspace_id}");
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
php artisan test tests/Unit/Services/TrialConversionServiceTest.php
```

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/Services/Retention/TrialConversionService.php
git add tests/Unit/Services/TrialConversionServiceTest.php
git commit -m "fix(retention): correct TrialConversionService to wrap event args in CommercialEventPayload"
```

---

## Task 3: Add TrialEndingSoon to SendCommercialNotification

**Files:**
- Modify: `app/Providers/CommercialServiceProvider.php`
- Modify: `app/Listeners/SaaS/SendCommercialNotification.php`
- Create: `tests/Feature/SaaS/TrialEndingSoonNotificationTest.php`

**Context:** `TrialEndingSoon` is registered with `LogCommercialEvent` but NOT with `SendCommercialNotification`. The `resolveMessage()` match also lacks a TrialEndingSoon case, so even if it were registered, it would silently return `null`.

- [ ] **Step 1: Write the failing test**

Create `tests/Feature/SaaS/TrialEndingSoonNotificationTest.php`:

```php
<?php

namespace Tests\Feature\SaaS;

use App\DTOs\SaaS\CommercialEventPayload;
use App\Events\SaaS\TrialEndingSoon;
use App\Models\Workspace;
use App\Models\WorkspaceSubscriptionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrialEndingSoonNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_trial_ending_soon_is_logged_as_subscription_event()
    {
        $ws = Workspace::factory()->create();

        event(new TrialEndingSoon(new CommercialEventPayload(
            workspaceId: $ws->id,
            meta: ['days_left' => 3, 'trial_ends_at' => now()->addDays(3)->toDateString()]
        )));

        $this->assertDatabaseHas('workspace_subscription_events', [
            'workspace_id' => $ws->id,
            'event_type'   => 'trial_ending_soon',
        ]);
    }

    public function test_trial_ending_soon_resolves_message_for_multiple_days()
    {
        $ws = Workspace::factory()->create();
        $payload = new CommercialEventPayload(
            workspaceId: $ws->id,
            meta: ['days_left' => 7, 'trial_ends_at' => '2026-04-17']
        );
        $event = new TrialEndingSoon($payload);

        $handler = app(\App\Listeners\SaaS\SendCommercialNotification::class);
        $method  = new \ReflectionMethod($handler, 'resolveMessage');
        $method->setAccessible(true);
        $message = $method->invoke($handler, $event);

        $this->assertNotNull($message);
        $this->assertStringContainsString('7', $message);
        $this->assertStringContainsString('dias', $message);
    }

    public function test_trial_ending_today_resolves_urgent_message()
    {
        $ws = Workspace::factory()->create();
        $payload = new CommercialEventPayload(
            workspaceId: $ws->id,
            meta: ['days_left' => 0, 'trial_ends_at' => today()->toDateString()]
        );
        $event = new TrialEndingSoon($payload);

        $handler = app(\App\Listeners\SaaS\SendCommercialNotification::class);
        $method  = new \ReflectionMethod($handler, 'resolveMessage');
        $method->setAccessible(true);
        $message = $method->invoke($handler, $event);

        $this->assertNotNull($message);
        $this->assertStringContainsString('hoje', $message);
    }
}
```

- [ ] **Step 2: Run test to verify failure**

```bash
php artisan test tests/Feature/SaaS/TrialEndingSoonNotificationTest.php --filter test_trial_ending_soon_resolves_message_for_multiple_days
```

Expected: FAIL — `resolveMessage()` returns null for TrialEndingSoon

- [ ] **Step 3: Register TrialEndingSoon with SendCommercialNotification in CommercialServiceProvider**

In `app/Providers/CommercialServiceProvider.php`, add `TrialEndingSoon` to the notification listener array (lines 34–40). Replace:

```php
        // Domain Notifications
        Event::listen([
            \App\Events\SaaS\SubscriptionActivated::class,
            \App\Events\SaaS\InvoiceGenerated::class,
            \App\Events\SaaS\InvoicePaid::class,
            \App\Events\SaaS\InvoiceOverdue::class,
            \App\Events\SaaS\InvoiceReminderSent::class,
        ], \App\Listeners\SaaS\SendCommercialNotification::class);
```

With:

```php
        // Domain Notifications
        Event::listen([
            \App\Events\SaaS\SubscriptionActivated::class,
            \App\Events\SaaS\InvoiceGenerated::class,
            \App\Events\SaaS\InvoicePaid::class,
            \App\Events\SaaS\InvoiceOverdue::class,
            \App\Events\SaaS\InvoiceReminderSent::class,
            \App\Events\SaaS\TrialEndingSoon::class,
        ], \App\Listeners\SaaS\SendCommercialNotification::class);
```

- [ ] **Step 4: Add TrialEndingSoon import and message case to SendCommercialNotification**

In `app/Listeners/SaaS/SendCommercialNotification.php`:

1. Add import after line 10 (after `use App\Events\SaaS\InvoiceReminderSent;`):

```php
use App\Events\SaaS\TrialEndingSoon;
```

2. Replace the entire `resolveMessage()` method:

```php
    protected function resolveMessage(CommercialEvent $event): ?string
    {
        return match (true) {
            $event instanceof SubscriptionActivated => "Bem-vindo ao Agenda Pro! Sua assinatura foi ativada com sucesso.",
            $event instanceof InvoicePaid           => "Obrigado! Recebemos o pagamento da sua fatura no valor de R$ " . number_format($event->payload->amount, 2, ',', '.'),
            $event instanceof InvoiceGenerated      => "Uma nova fatura foi gerada para o seu workspace. Link para pagamento: " . ($event->payload->meta['payment_link'] ?? 'Painel de Assinatura'),
            $event instanceof InvoiceOverdue        => "Atenção: Sua fatura está vencida. Regularize sua situação para evitar a suspensão dos serviços.",
            $event instanceof InvoiceReminderSent   => "Lembrete: Você possui uma fatura pendente com vencimento em " . ($event->payload->meta['due_date'] ?? 'breve'),
            $event instanceof TrialEndingSoon       => $this->trialEndingSoonMessage($event),
            default => null,
        };
    }

    private function trialEndingSoonMessage(TrialEndingSoon $event): string
    {
        $daysLeft    = $event->payload->meta['days_left'] ?? null;
        $trialEndsAt = $event->payload->meta['trial_ends_at'] ?? null;

        if ($daysLeft === 0) {
            return "Atenção: seu período de teste termina hoje. Assine agora para manter o acesso ao Agenda Pro.";
        }

        $suffix = $trialEndsAt ? " ({$trialEndsAt})" : '';
        $unit   = $daysLeft === 1 ? 'dia' : 'dias';

        return "Seu período de teste do Agenda Pro termina em {$daysLeft} {$unit}{$suffix}. Assine para continuar.";
    }
```

- [ ] **Step 5: Run all TrialEndingSoon tests**

```bash
php artisan test tests/Feature/SaaS/TrialEndingSoonNotificationTest.php
```

Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/Providers/CommercialServiceProvider.php
git add app/Listeners/SaaS/SendCommercialNotification.php
git add tests/Feature/SaaS/TrialEndingSoonNotificationTest.php
git commit -m "feat(notifications): add TrialEndingSoon handling to SendCommercialNotification"
```

---

## Task 4: Clean DunningService misleading TODO comments

**Files:**
- Modify: `app/Services/Retention/DunningService.php`

**Context:** The 3 `// TODO: call Notification service` comments are misleading. Notifications ARE sent via the event system: `recordReminder()` dispatches `InvoiceReminderSent`, which `SendCommercialNotification` listens to and sends. The comment implies nothing is happening, which is wrong.

- [ ] **Step 1: Replace all 3 TODO comments**

In `app/Services/Retention/DunningService.php`:

Replace line 47:
```php
            // TODO: call Notification service
```
With:
```php
            // InvoiceReminderSent event dispatched inside recordReminder() → handled by SendCommercialNotification
```

Replace line 67:
```php
            // TODO: call Notification service
```
With:
```php
            // InvoiceReminderSent event dispatched inside recordReminder() → handled by SendCommercialNotification
```

Replace line 90:
```php
            // TODO: call Notification service
```
With:
```php
            // InvoiceReminderSent event dispatched inside recordReminder() → handled by SendCommercialNotification
```

- [ ] **Step 2: Run existing DunningService tests to confirm nothing broke**

```bash
php artisan test tests/Unit/Services/DunningServiceTest.php
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add app/Services/Retention/DunningService.php
git commit -m "refactor(dunning): replace misleading TODO comments with accurate flow description"
```

---

## Task 5: Add workspace_id to financial tables (migration)

**Files:**
- Create: `database/migrations/2026_04_10_000001_add_workspace_id_to_financial_tables.php`

**Context:** `wallets`, `wallet_transactions`, and `customer_packages` have no `workspace_id`. They are tenant-scoped through `customer_id → customers.workspace_id`, but this indirect path risks cross-tenant leaks in reporting queries. Adding `workspace_id` directly enables safe, direct scoping without joins.

**Strategy:**
- Add column as nullable (safe for existing rows)
- Backfill from customer relationship (PHP loop for cross-DB compatibility)
- Add index (performance for tenant-scoped queries)
- Add FK constraint on MySQL only (SQLite doesn't enforce FKs)
- `wallet_transactions` gets no FK (value is derived, not owned — its authoritative source is `wallets.workspace_id`)
- `down()` is fully implemented (this is a new migration)

- [ ] **Step 1: Create the migration file**

Create `database/migrations/2026_04_10_000001_add_workspace_id_to_financial_tables.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint T4 — Add workspace_id to financial tables for direct multi-tenant scoping.
 *
 * Tables affected: wallets, wallet_transactions, customer_packages
 *
 * All three tables previously relied on indirect workspace resolution through
 * customer_id → customers.workspace_id. This migration adds workspace_id directly
 * and backfills existing rows.
 *
 * The column is kept nullable to allow for rows where workspace resolution
 * fails (e.g., customer without workspace_id — should not exist in prod).
 *
 * Also adds a composite index on wallet_transactions(reference_type, reference_id)
 * which was missing (identified in Sprint T2 audit, R5).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Step 1: Add workspace_id columns ───────────────────────────────
        Schema::table('wallets', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('id');
            $table->index('workspace_id', 'wallets_workspace_id_index');
        });

        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('id');
            $table->index('workspace_id', 'wallet_transactions_workspace_id_index');
            // Missing index from T2 audit (R5)
            $table->index(['reference_type', 'reference_id'], 'wallet_transactions_reference_index');
        });

        Schema::table('customer_packages', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('id');
            $table->index('workspace_id', 'customer_packages_workspace_id_index');
        });

        // ── Step 2: Backfill wallets.workspace_id ──────────────────────────
        foreach (DB::table('wallets')->get(['id', 'customer_id']) as $wallet) {
            $workspaceId = DB::table('customers')
                ->where('id', $wallet->customer_id)
                ->value('workspace_id');
            if ($workspaceId) {
                DB::table('wallets')
                    ->where('id', $wallet->id)
                    ->update(['workspace_id' => $workspaceId]);
            }
        }

        // ── Step 3: Backfill wallet_transactions.workspace_id ──────────────
        foreach (DB::table('wallet_transactions')->get(['id', 'wallet_id']) as $txn) {
            $workspaceId = DB::table('wallets')
                ->where('id', $txn->wallet_id)
                ->value('workspace_id');
            if ($workspaceId) {
                DB::table('wallet_transactions')
                    ->where('id', $txn->id)
                    ->update(['workspace_id' => $workspaceId]);
            }
        }

        // ── Step 4: Backfill customer_packages.workspace_id ────────────────
        foreach (DB::table('customer_packages')->get(['id', 'customer_id']) as $pkg) {
            $workspaceId = DB::table('customers')
                ->where('id', $pkg->customer_id)
                ->value('workspace_id');
            if ($workspaceId) {
                DB::table('customer_packages')
                    ->where('id', $pkg->id)
                    ->update(['workspace_id' => $workspaceId]);
            }
        }

        // ── Step 5: Add FK constraints (MySQL only) ────────────────────────
        // wallet_transactions does not get a direct FK — its workspace_id is
        // a denormalized copy derived from wallets → customers.
        if (config('database.default') !== 'sqlite') {
            Schema::table('wallets', function (Blueprint $table) {
                $table->foreign('workspace_id', 'wallets_workspace_id_foreign')
                    ->references('id')
                    ->on('workspaces')
                    ->cascadeOnDelete();
            });

            Schema::table('customer_packages', function (Blueprint $table) {
                $table->foreign('workspace_id', 'customer_packages_workspace_id_foreign')
                    ->references('id')
                    ->on('workspaces')
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Drop FK constraints first (MySQL only)
        if (config('database.default') !== 'sqlite') {
            Schema::table('wallets', function (Blueprint $table) {
                $table->dropForeign('wallets_workspace_id_foreign');
            });

            Schema::table('customer_packages', function (Blueprint $table) {
                $table->dropForeign('customer_packages_workspace_id_foreign');
            });
        }

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropIndex('wallets_workspace_id_index');
            $table->dropColumn('workspace_id');
        });

        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropIndex('wallet_transactions_workspace_id_index');
            $table->dropIndex('wallet_transactions_reference_index');
            $table->dropColumn('workspace_id');
        });

        Schema::table('customer_packages', function (Blueprint $table) {
            $table->dropIndex('customer_packages_workspace_id_index');
            $table->dropColumn('workspace_id');
        });
    }
};
```

- [ ] **Step 2: Run migration to verify it applies cleanly**

```bash
php artisan migrate --path=database/migrations/2026_04_10_000001_add_workspace_id_to_financial_tables.php
```

Expected: Migration runs without error

- [ ] **Step 3: Verify rollback works**

```bash
php artisan migrate:rollback --path=database/migrations/2026_04_10_000001_add_workspace_id_to_financial_tables.php
```

Expected: Rolls back cleanly. Then re-apply:

```bash
php artisan migrate --path=database/migrations/2026_04_10_000001_add_workspace_id_to_financial_tables.php
```

- [ ] **Step 4: Commit migration**

```bash
git add database/migrations/2026_04_10_000001_add_workspace_id_to_financial_tables.php
git commit -m "feat(schema): add workspace_id to wallets, wallet_transactions, customer_packages"
```

---

## Task 6: Update financial models

**Files:**
- Modify: `app/Models/Wallet.php`
- Modify: `app/Models/WalletTransaction.php`
- Modify: `app/Models/CustomerPackage.php`

- [ ] **Step 1: Update Wallet model**

Replace the contents of `app/Models/Wallet.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    protected $fillable = ['customer_id', 'workspace_id', 'balance'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
```

- [ ] **Step 2: Update WalletTransaction model**

Replace the contents of `app/Models/WalletTransaction.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    protected $fillable = [
        'wallet_id',
        'workspace_id',
        'amount',
        'type',
        'description',
        'reference_type',
        'reference_id',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }
}
```

- [ ] **Step 3: Update CustomerPackage model**

Replace the contents of `app/Models/CustomerPackage.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPackage extends Model
{
    protected $fillable = [
        'customer_id',
        'package_id',
        'workspace_id',
        'remaining_sessions',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'expires_at' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active'
            && ($this->expires_at === null || $this->expires_at->isFuture())
            && $this->remaining_sessions > 0;
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/Models/Wallet.php app/Models/WalletTransaction.php app/Models/CustomerPackage.php
git commit -m "feat(models): add workspace_id to Wallet, WalletTransaction, CustomerPackage"
```

---

## Task 7: Tests — financial workspace_id isolation

**Files:**
- Create: `tests/Feature/Finance/FinancialMultiTenantTest.php`

- [ ] **Step 1: Create the test file**

Create `tests/Feature/Finance/FinancialMultiTenantTest.php`:

```php
<?php

namespace Tests\Feature\Finance;

use App\Models\Customer;
use App\Models\CustomerPackage;
use App\Models\Package;
use App\Models\Service;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialMultiTenantTest extends TestCase
{
    use RefreshDatabase;

    private Workspace $wsA;
    private Workspace $wsB;
    private Customer $customerA;
    private Customer $customerB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->wsA = Workspace::factory()->create(['slug' => 'ws-a']);
        $this->wsB = Workspace::factory()->create(['slug' => 'ws-b']);

        $this->customerA = Customer::factory()->create(['workspace_id' => $this->wsA->id]);
        $this->customerB = Customer::factory()->create(['workspace_id' => $this->wsB->id]);
    }

    // ── Wallet isolation ───────────────────────────────────────────────────

    public function test_wallet_stores_and_retrieves_workspace_id()
    {
        $wallet = Wallet::create([
            'customer_id'  => $this->customerA->id,
            'workspace_id' => $this->wsA->id,
            'balance'      => 150.00,
        ]);

        $this->assertEquals($this->wsA->id, $wallet->fresh()->workspace_id);
    }

    public function test_wallets_can_be_scoped_by_workspace()
    {
        Wallet::create(['customer_id' => $this->customerA->id, 'workspace_id' => $this->wsA->id, 'balance' => 50]);
        Wallet::create(['customer_id' => $this->customerB->id, 'workspace_id' => $this->wsB->id, 'balance' => 75]);

        $walletsA = Wallet::where('workspace_id', $this->wsA->id)->get();
        $walletsB = Wallet::where('workspace_id', $this->wsB->id)->get();

        $this->assertCount(1, $walletsA);
        $this->assertCount(1, $walletsB);
        $this->assertEquals($this->customerA->id, $walletsA->first()->customer_id);
    }

    // ── WalletTransaction isolation ────────────────────────────────────────

    public function test_wallet_transaction_stores_workspace_id()
    {
        $wallet = Wallet::create([
            'customer_id'  => $this->customerA->id,
            'workspace_id' => $this->wsA->id,
            'balance'      => 0,
        ]);

        $txn = WalletTransaction::create([
            'wallet_id'    => $wallet->id,
            'workspace_id' => $this->wsA->id,
            'amount'       => 100.00,
            'type'         => 'credit',
            'description'  => 'Test credit',
        ]);

        $this->assertEquals($this->wsA->id, $txn->fresh()->workspace_id);
    }

    public function test_wallet_transactions_can_be_scoped_by_workspace()
    {
        $walletA = Wallet::create(['customer_id' => $this->customerA->id, 'workspace_id' => $this->wsA->id, 'balance' => 0]);
        $walletB = Wallet::create(['customer_id' => $this->customerB->id, 'workspace_id' => $this->wsB->id, 'balance' => 0]);

        WalletTransaction::create(['wallet_id' => $walletA->id, 'workspace_id' => $this->wsA->id, 'amount' => 50, 'type' => 'credit']);
        WalletTransaction::create(['wallet_id' => $walletA->id, 'workspace_id' => $this->wsA->id, 'amount' => 25, 'type' => 'debit']);
        WalletTransaction::create(['wallet_id' => $walletB->id, 'workspace_id' => $this->wsB->id, 'amount' => 200, 'type' => 'credit']);

        $txnsA = WalletTransaction::where('workspace_id', $this->wsA->id)->get();
        $txnsB = WalletTransaction::where('workspace_id', $this->wsB->id)->get();

        $this->assertCount(2, $txnsA);
        $this->assertCount(1, $txnsB);
    }

    // ── CustomerPackage isolation ──────────────────────────────────────────

    public function test_customer_package_stores_workspace_id()
    {
        $service = Service::create([
            'workspace_id' => $this->wsA->id,
            'name'         => 'Test Service',
            'duration'     => 60,
            'price'        => 100,
            'is_active'    => true,
        ]);

        $package = \App\Models\Package::create([
            'service_id'    => $service->id,
            'name'          => 'Pack 10',
            'sessions_count'=> 10,
            'price'         => 900,
            'validity_days' => 90,
            'is_active'     => true,
        ]);

        $cp = CustomerPackage::create([
            'customer_id'       => $this->customerA->id,
            'package_id'        => $package->id,
            'workspace_id'      => $this->wsA->id,
            'remaining_sessions'=> 10,
            'status'            => 'active',
        ]);

        $this->assertEquals($this->wsA->id, $cp->fresh()->workspace_id);
    }

    public function test_customer_packages_can_be_scoped_by_workspace()
    {
        $service = Service::create([
            'workspace_id' => $this->wsA->id, 'name' => 'Svc', 'duration' => 60, 'price' => 100, 'is_active' => true,
        ]);
        $package = \App\Models\Package::create([
            'service_id' => $service->id, 'name' => 'P10', 'sessions_count' => 10,
            'price' => 900, 'validity_days' => 90, 'is_active' => true,
        ]);

        CustomerPackage::create([
            'customer_id' => $this->customerA->id, 'package_id' => $package->id,
            'workspace_id' => $this->wsA->id, 'remaining_sessions' => 5, 'status' => 'active',
        ]);
        CustomerPackage::create([
            'customer_id' => $this->customerB->id, 'package_id' => $package->id,
            'workspace_id' => $this->wsB->id, 'remaining_sessions' => 3, 'status' => 'active',
        ]);

        $pkgsA = CustomerPackage::where('workspace_id', $this->wsA->id)->get();
        $pkgsB = CustomerPackage::where('workspace_id', $this->wsB->id)->get();

        $this->assertCount(1, $pkgsA);
        $this->assertCount(1, $pkgsB);
        $this->assertEquals($this->customerA->id, $pkgsA->first()->customer_id);
    }
}
```

- [ ] **Step 2: Run the tests**

```bash
php artisan test tests/Feature/Finance/FinancialMultiTenantTest.php
```

Expected: All 6 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Finance/FinancialMultiTenantTest.php
git commit -m "test(finance): add workspace isolation tests for wallets, wallet_transactions, customer_packages"
```

---

## Task 8: Run full test suite checkpoint

- [ ] **Step 1: Run the full test suite**

```bash
php artisan test
```

Expected: All tests PASS. If any existing test fails due to missing `workspace_id` in test setup, add the field to the relevant factory call or model creation in that test.

- [ ] **Step 2: Fix any broken tests found**

If `FinancialExpansionTest` or similar tests create Wallet/WalletTransaction/CustomerPackage without `workspace_id`, add `workspace_id` to those create calls. Example pattern:

```php
// Before
Wallet::create(['customer_id' => $customer->id, 'balance' => 100]);

// After
Wallet::create(['customer_id' => $customer->id, 'workspace_id' => $customer->workspace_id, 'balance' => 100]);
```

- [ ] **Step 3: Commit any fixes**

```bash
git add tests/
git commit -m "test: fix existing tests to include workspace_id on financial models"
```

---

## Task 9: Update documentation

**Files:**
- Modify: `docs/db/migration-audit.md`
- Modify: `docs/db/schema-map.md`
- Modify: `docs/db/schema-recommendations.md`
- Modify: `docs/ops/billing-saas.md`
- Modify: `docs/ops/schedulers-and-jobs.md`

- [ ] **Step 1: Update migration-audit.md — add T4 section**

Append the following to `docs/db/migration-audit.md` (after the last existing section):

```markdown
---

## Sprint T4 — Hardening Audit (2026-04-10)

### Migrations com `down()` incompleto (não corrigíveis sem rollback manual)

As seguintes migrations têm `down()` incompleto e **não devem ser revertidas com `migrate:rollback`** em ambientes com dados:

| Migration | Problema | Impacto se revertida |
|-----------|----------|---------------------|
| `2026_03_23_231245_add_clinic_id_to_core_tables.php` | `down()` tem corpo vazio — não dropa `clinic_id` de users, customers, appointments, charges | Schema inconsistente |
| `2026_03_23_231933_add_clinic_id_to_remaining_core_tables.php` | `down()` referencia tabela inexistente `remaining_core_tables` | Erro de schema no rollback |
| `2026_03_23_233136_add_clinic_id_to_receipts_table.php` | `down()` tem corpo vazio — não dropa `clinic_id` de receipts | Schema inconsistente |

**Ação adotada:** Comentários de aviso foram adicionados diretamente nos arquivos. Não foi feita edição funcional — as migrations já estão no histórico de produção.

**Regra de CI:** Em ambientes efêmeros (CI/CD), usar sempre `php artisan migrate:fresh --seed` em vez de `migrate:rollback`.

---

### Migration vazia (placeholder)

| Migration | Status |
|-----------|--------|
| `2026_04_09_145551_add_retention_fields_to_workspace_subscriptions.php` | Placeholder vazio commitado acidentalmente. Campos de retenção foram adicionados nas migrations `_175548` e `_151108`. Comentário explicativo adicionado no arquivo. |

---

### Timestamps duplicados (benignos)

| Timestamp | Migrations | Comportamento |
|-----------|-----------|---------------|
| `2026_03_22_024705` | `create_customers_table`, `create_services_table` | Executadas em ordem alfabética. Sem dependência de FK entre si. Comportamento correto. |
| `2026_03_22_024706` | `create_appointments_table`, `create_charges_table`, `create_reminder_logs_table` | Idem — ordem alfabética, sem FK cruzado. |

Nenhuma ação necessária.

---

### Nova migration adicionada na Sprint T4

| Migration | O que faz |
|-----------|----------|
| `2026_04_10_000001_add_workspace_id_to_financial_tables.php` | Adiciona `workspace_id` em `wallets`, `wallet_transactions`, `customer_packages`. Faz backfill via customer relationship. Adiciona índices e FKs (MySQL). Também adiciona índice composto em `wallet_transactions(reference_type, reference_id)`. |
```

- [ ] **Step 2: Update schema-map.md — add workspace_id to financial table descriptions**

In `docs/db/schema-map.md`, find the section describing `wallets` and update it. The new table schema entries should include `workspace_id`:

```markdown
### `wallets` *(atualizado Sprint T4)*
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | nullable, cascade — adicionado T4 para isolamento direto |
| customer_id | bigint FK→customers UNIQUE | cascade |
| balance | decimal(12,2) | default 0 |
| created_at, updated_at | timestamps | |

### `wallet_transactions` *(atualizado Sprint T4)*
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint | nullable, sem FK direta (derivado de wallets) — adicionado T4 |
| wallet_id | bigint FK→wallets | cascade |
| amount | decimal(12,2) | |
| type | varchar | 'credit' ou 'debit' |
| description | varchar | nullable |
| reference_type | varchar | nullable — polimorfismo manual |
| reference_id | bigint | nullable |
| created_at, updated_at | timestamps | |

**Índices em wallet_transactions:** `workspace_id`, `(reference_type, reference_id)` — ambos adicionados Sprint T4.

### `customer_packages` *(atualizado Sprint T4)*
| Coluna | Tipo | Notas |
|--------|------|-------|
| id | bigint PK | |
| workspace_id | bigint FK→workspaces | nullable, cascade — adicionado T4 |
| customer_id | bigint FK→customers | cascade |
| package_id | bigint FK→packages | cascade |
| remaining_sessions | int | |
| expires_at | date | nullable |
| status | varchar | 'active', 'expired', 'exhausted', 'canceled' |
| created_at, updated_at | timestamps | |
```

- [ ] **Step 3: Update schema-recommendations.md — mark R3 and R5 as resolved**

In `docs/db/schema-recommendations.md`, update the status of recommendations R3 and R5:

Find the R3 section and add at the end:
```markdown
**Status T4:** ✅ IMPLEMENTADO — migration `2026_04_10_000001` criada. workspace_id adicionado e backfill executado. FKs adicionadas no MySQL.
```

Find the R5 section and add:
```markdown
**Status T4:** ✅ IMPLEMENTADO — índice `(reference_type, reference_id)` adicionado na mesma migration T4.
```

Find the R1 section and add:
```markdown
**Status T4:** Documentado com comentários de aviso nas migrations. Abordagem conservadora adotada (não editar migrations históricas). CI deve usar `migrate:fresh`.
```

Find the R2 section and add:
```markdown
**Status T4:** Comentário explicativo adicionado na migration vazia `2026_04_09_145551`.
```

- [ ] **Step 4: Update billing-saas.md — add TrialEndingSoon notification**

In `docs/ops/billing-saas.md`, find the section about notifications or events (create a Notifications section if it doesn't exist). Add:

```markdown
## Notificações Comerciais (SendCommercialNotification)

O listener `SendCommercialNotification` envia mensagem via `MessagingServiceInterface` para os seguintes eventos:

| Evento | Mensagem enviada |
|--------|-----------------|
| `SubscriptionActivated` | Boas-vindas à assinatura |
| `InvoiceGenerated` | Link de nova fatura gerada |
| `InvoicePaid` | Confirmação de pagamento recebido |
| `InvoiceOverdue` | Alerta de fatura vencida |
| `InvoiceReminderSent` | Lembrete de vencimento (dunning) |
| `TrialEndingSoon` | ✅ **(adicionado Sprint T4)** — alerta de trial expirando em N dias ou hoje |

### TrialEndingSoon — comportamento

- **meta.days_left = 7 ou 3**: mensagem padrão informando quantos dias restam
- **meta.days_left = 0**: mensagem urgente indicando que o trial termina hoje
- Disparado por: `TrialConversionService::processTrialAlerts()`
- Agendamento: `saas:retention-ops` (manual) ou automatizável via cron

### Dunning — fluxo de notificação

O `DunningService` registra o evento `InvoiceReminderSent` via `recordReminder()`. Este evento é capturado por `SendCommercialNotification` que envia a mensagem. O registro idempotente é feito em `workspace_subscription_events`.
```

- [ ] **Step 5: Update schedulers-and-jobs.md — update saas:retention-ops entry**

In `docs/ops/schedulers-and-jobs.md`, find the `saas:retention-ops` entry and update it:

```markdown
### `saas:retention-ops`
**Arquivo:** `app/Console/Commands/ProcessRetentionAndDunningOps.php`  
**Frequência:** Manual (não agendado automaticamente — considerar automatizar em T5)

Executa dois serviços em sequência:

**1. DunningService::processReminders()**
| Tipo | Gatilho | Resultado |
|------|---------|-----------|
| `upcoming` | Invoice pendente vencendo em 3 dias | Dispara `InvoiceReminderSent` → `SendCommercialNotification` |
| `due_today` | Invoice pendente vencendo hoje | Dispara `InvoiceReminderSent` → `SendCommercialNotification` |
| `overdue` | Invoice overdue sem aviso enviado | Dispara `InvoiceReminderSent` → `SendCommercialNotification` |

**2. TrialConversionService::processTrialAlerts()** *(corrigido Sprint T4)*
| Threshold | Gatilho | Resultado |
|-----------|---------|-----------|
| `7_days` | Trial expira em 7 dias | Dispara `TrialEndingSoon` → `LogCommercialEvent` + `SendCommercialNotification` |
| `3_days` | Trial expira em 3 dias | Dispara `TrialEndingSoon` → `LogCommercialEvent` + `SendCommercialNotification` |
| `today` | Trial expira hoje | Dispara `TrialEndingSoon` → `LogCommercialEvent` + `SendCommercialNotification` |

**Idempotência:** SIM — ambos os serviços verificam `workspace_subscription_events` antes de redisparar.

**Como rodar manualmente:**
```bash
php artisan saas:retention-ops
```

**Investigar execuções:**
```sql
SELECT * FROM workspace_subscription_events
WHERE event_type IN ('trial_ending_soon', 'reminder_sent')
ORDER BY created_at DESC LIMIT 50;
```
```

- [ ] **Step 6: Commit all documentation updates**

```bash
git add docs/db/migration-audit.md docs/db/schema-map.md docs/db/schema-recommendations.md
git add docs/ops/billing-saas.md docs/ops/schedulers-and-jobs.md
git commit -m "docs(sprint-t4): update migration audit, schema map, recommendations, billing and scheduler docs"
```

---

## Task 10: Final validation

- [ ] **Step 1: Run the full test suite one last time**

```bash
php artisan test --stop-on-failure
```

Expected: All tests PASS. Zero failures.

- [ ] **Step 2: Verify migration history is clean**

```bash
php artisan migrate:status
```

Expected: All migrations show `Ran` status. No pending migrations.

- [ ] **Step 3: Verify saas:retention-ops runs end-to-end without error**

```bash
php artisan saas:retention-ops
```

Expected: Output shows both Dunning and Trial stats. No PHP errors. Example:
```
Iniciando processamento de Retention Ops...
Dunning -> Upcoming: 0 | Due Today: 0 | Overdue: 0
Trials -> 7 Days: 0 | 3 Days: 0 | Today: 0
```

- [ ] **Step 4: Final commit if any loose ends**

```bash
git add -p  # review any remaining changes
git commit -m "chore(sprint-t4): final cleanup and validation"
```

---

## Self-Review — Spec Coverage Check

| Sprint T4 Requirement | Task | Status |
|-----------------------|------|--------|
| Corrigir down() quebrados | Task 1 | Documented with comments (cannot edit historic migrations) |
| Tratar migration vazia | Task 1 | Comment added |
| Resolver duplicidade de nome | Task 1 | Documented as benign |
| workspace_id em wallets | Task 5 + 6 + 7 | Migration + models + tests |
| workspace_id em wallet_transactions | Task 5 + 6 + 7 | Migration + models + tests |
| workspace_id em customer_packages | Task 5 + 6 + 7 | Migration + models + tests |
| Corrigir bug TrialConversionService | Task 2 | Fixed + test |
| Comando saas:retention-ops ponta-a-ponta | Task 2 + 10 | Fixed + validated |
| TrialEndingSoon com tratamento claro | Task 3 | Listener registered + message resolved + tests |
| TODOs dunning resolvidos | Task 4 | Comments replaced with accurate description |
| Testes de rollback de migrations | Task 5 (step 3) | Rollback tested manually |
| Testes de workspace_id em tabelas financeiras | Task 7 | 6 tests covering all 3 tables |
| Testes de saas:retention-ops | Task 2 (3 tests) | TrialConversionService full coverage |
| Testes de TrialEndingSoon | Task 3 (3 tests) | Logging + message resolution |
| Atualizar migration-audit.md | Task 9 | Done |
| Atualizar schema-map.md | Task 9 | Done |
| Atualizar schema-recommendations.md | Task 9 | Done |
| Atualizar billing-saas.md | Task 9 | Done |
| Atualizar schedulers-and-jobs.md | Task 9 | Done |

---

## Residual Risks (para Sprint T5)

| Risco | Detalhes |
|-------|---------|
| `packages.clinic_id` não renomeado | A migration `add_clinic_id_to_remaining_core_tables` adicionou `clinic_id` ao `packages` table (template), mas o rename migration não incluiu `packages` em `tenantTables`. Packages hoje tem `clinic_id` orphan. Investigar e criar migration de rename/cleanup. |
| workspace_id nullable nas tabelas financeiras | workspace_id foi adicionado como nullable. Se houver customers sem workspace_id (não deveria existir), as linhas ficam com workspace_id = null. Monitorar e considerar NOT NULL após verificação em prod. |
| saas:retention-ops não agendado | O comando não está no scheduler. Precisa de um cron entry para funcionar automaticamente em produção. Avaliar frequência e adicionar em Sprint T5. |
| Enum types em billing | R4 do T2 (enum constraints em workspace_subscriptions.status, customer_packages.status, wallet_transactions.type) não implementado. Requer doctrine/dbal. Avaliar como debt técnico para T5. |
| Testes para migrate:fresh reprodutibilidade | A reprodutibilidade completa do schema ainda não é testada automaticamente. Considerar um smoke test de CI que executa migrate:fresh em ambiente limpo. |
