<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 1 – Domain rename: clinic → workspace
 *
 * Renames:
 *   - Table  clinics           → workspaces
 *   - Column clinic_id         → workspace_id (in all tenant tables)
 *
 * Affected tables:
 *   users, customers, appointments, charges, receipts,
 *   services, professionals, professional_schedules,
 *   holidays, settings, waitlist_entries, crm_actions
 *
 * Compatibility: fully reversible via down().
 */
return new class extends Migration
{
    /** Tables that carry a clinic_id foreign key */
    private array $tenantTables = [
        'users',
        'customers',
        'appointments',
        'charges',
        'receipts',
        'services',
        'professionals',
        'professional_schedules',
        'holidays',
        'settings',
        'waitlist_entries',
        'crm_actions',
    ];

    public function up(): void
    {
        // 1. Rename the root tenant table
        if (Schema::hasTable('clinics') && !Schema::hasTable('workspaces')) {
            Schema::rename('clinics', 'workspaces');
        }

        // 2. For each tenant table: drop FK, rename column, recreate FK
        foreach ($this->tenantTables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            if (!Schema::hasColumn($table, 'clinic_id')) {
                continue;
            }

            if (config('database.default') !== 'sqlite') {
                Schema::table($table, function (Blueprint $bp) use ($table) {
                    // Drop existing FK constraint (Laravel convention: table_column_foreign)
                    $bp->dropForeign("{$table}_clinic_id_foreign");
                });
            }

            if (Schema::hasColumn($table, 'clinic_id') && !Schema::hasColumn($table, 'workspace_id')) {
                Schema::table($table, function (Blueprint $bp) {
                    $bp->renameColumn('clinic_id', 'workspace_id');
                });
            }

            if (config('database.default') !== 'sqlite') {
                Schema::table($table, function (Blueprint $bp) {
                    $bp->foreign('workspace_id')
                        ->references('id')
                        ->on('workspaces')
                        ->cascadeOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        // Reverse: workspaces → clinics, workspace_id → clinic_id
        foreach (array_reverse($this->tenantTables) as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            if (!Schema::hasColumn($table, 'workspace_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $bp) use ($table) {
                $bp->dropForeign("{$table}_workspace_id_foreign");
            });

            Schema::table($table, function (Blueprint $bp) {
                $bp->renameColumn('workspace_id', 'clinic_id');
            });

            Schema::table($table, function (Blueprint $bp) {
                $bp->foreign('clinic_id')
                    ->references('id')
                    ->on('clinics')
                    ->cascadeOnDelete();
            });
        }

        Schema::rename('workspaces', 'clinics');
    }
};
