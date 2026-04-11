<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ---------------------------------------------------------------
        // Step 1 — Add nullable workspace_id columns
        // ---------------------------------------------------------------
        Schema::table('wallets', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('id');
        });

        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('id');
        });

        Schema::table('customer_packages', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('id');
        });

        // ---------------------------------------------------------------
        // Step 2 — Orphan detection (log but do NOT abort)
        // ---------------------------------------------------------------

        // Customers without a workspace_id
        $orphanCustomers = DB::table('customers')
            ->whereNull('workspace_id')
            ->count();

        if ($orphanCustomers > 0) {
            Log::warning("Migration: {$orphanCustomers} customer(s) have no workspace_id. "
                . 'Their wallets and customer_packages will NOT be backfilled.');
        }

        // Wallets whose customer_id points to a missing customer
        $orphanWallets = DB::table('wallets')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('customers')
                    ->whereColumn('customers.id', 'wallets.customer_id');
            })
            ->count();

        if ($orphanWallets > 0) {
            Log::warning("Migration: {$orphanWallets} wallet(s) have no matching customer. "
                . 'They will be skipped during backfill.');
        }

        // WalletTransactions whose wallet_id points to a missing wallet
        $orphanTransactions = DB::table('wallet_transactions')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('wallets')
                    ->whereColumn('wallets.id', 'wallet_transactions.wallet_id');
            })
            ->count();

        if ($orphanTransactions > 0) {
            Log::warning("Migration: {$orphanTransactions} wallet_transaction(s) have no matching wallet. "
                . 'They will be skipped during backfill.');
        }

        // customer_packages whose customer_id points to a missing customer
        $orphanPackages = DB::table('customer_packages')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('customers')
                    ->whereColumn('customers.id', 'customer_packages.customer_id');
            })
            ->count();

        if ($orphanPackages > 0) {
            Log::warning("Migration: {$orphanPackages} customer_package(s) have no matching customer. "
                . 'They will be skipped during backfill.');
        }

        // ---------------------------------------------------------------
        // Step 3 — Idempotent backfill: wallets via customer_id
        // Uses cross-DB compatible chunked query builder (no MySQL-only JOIN UPDATE).
        // Only updates rows that still have workspace_id = NULL.
        // ---------------------------------------------------------------
        DB::table('wallets')
            ->whereNull('workspace_id')
            ->whereNotNull('customer_id')
            ->chunkById(500, function ($wallets) {
                $customerIds = $wallets->pluck('customer_id')->unique()->all();

                $workspaceMap = DB::table('customers')
                    ->whereIn('id', $customerIds)
                    ->whereNotNull('workspace_id')
                    ->pluck('workspace_id', 'id'); // [customer_id => workspace_id]

                foreach ($wallets as $wallet) {
                    if (isset($workspaceMap[$wallet->customer_id])) {
                        DB::table('wallets')
                            ->where('id', $wallet->id)
                            ->whereNull('workspace_id')
                            ->update(['workspace_id' => $workspaceMap[$wallet->customer_id]]);
                    }
                }
            });

        // ---------------------------------------------------------------
        // Step 4 — Idempotent backfill: wallet_transactions via wallet chain
        // Derives workspace_id from already-populated wallets.workspace_id
        // (NOT from customers directly — derive from wallet chain only)
        // ---------------------------------------------------------------
        DB::table('wallet_transactions')
            ->whereNull('workspace_id')
            ->whereNotNull('wallet_id')
            ->chunkById(500, function ($transactions) {
                $walletIds = $transactions->pluck('wallet_id')->unique()->all();

                $workspaceMap = DB::table('wallets')
                    ->whereIn('id', $walletIds)
                    ->whereNotNull('workspace_id')
                    ->pluck('workspace_id', 'id'); // [wallet_id => workspace_id]

                foreach ($transactions as $txn) {
                    if (isset($workspaceMap[$txn->wallet_id])) {
                        DB::table('wallet_transactions')
                            ->where('id', $txn->id)
                            ->whereNull('workspace_id')
                            ->update(['workspace_id' => $workspaceMap[$txn->wallet_id]]);
                    }
                }
            });

        // ---------------------------------------------------------------
        // Step 5 — Idempotent backfill: customer_packages via customer_id
        // ---------------------------------------------------------------
        DB::table('customer_packages')
            ->whereNull('workspace_id')
            ->whereNotNull('customer_id')
            ->chunkById(500, function ($packages) {
                $customerIds = $packages->pluck('customer_id')->unique()->all();

                $workspaceMap = DB::table('customers')
                    ->whereIn('id', $customerIds)
                    ->whereNotNull('workspace_id')
                    ->pluck('workspace_id', 'id'); // [customer_id => workspace_id]

                foreach ($packages as $package) {
                    if (isset($workspaceMap[$package->customer_id])) {
                        DB::table('customer_packages')
                            ->where('id', $package->id)
                            ->whereNull('workspace_id')
                            ->update(['workspace_id' => $workspaceMap[$package->customer_id]]);
                    }
                }
            });

        // ---------------------------------------------------------------
        // Step 6 — Workspace-scoped indexes
        // ---------------------------------------------------------------
        Schema::table('wallets', function (Blueprint $table) {
            $table->index('workspace_id', 'wallets_workspace_id_index');
        });

        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->index('workspace_id', 'wallet_transactions_workspace_id_index');
            // Compound index for reference lookups (noted missing in T2 audit)
            $table->index(['reference_type', 'reference_id'], 'wallet_transactions_reference_index');
        });

        Schema::table('customer_packages', function (Blueprint $table) {
            $table->index('workspace_id', 'customer_packages_workspace_id_index');
        });

        // ---------------------------------------------------------------
        // Step 7 — FK constraints on MySQL only
        // wallet_transactions intentionally excluded (derived value, not owned)
        // ---------------------------------------------------------------
        // FK constraints are skipped on SQLite (used in tests) as it does not
        // enforce foreign key integrity by default and lacks ALTER TABLE support.
        if (config('database.default') !== 'sqlite') {
            Schema::table('wallets', function (Blueprint $table) {
                $table->foreign('workspace_id', 'wallets_workspace_id_foreign')
                    ->references('id')
                    ->on('workspaces')
                    ->nullOnDelete();
            });

            Schema::table('customer_packages', function (Blueprint $table) {
                $table->foreign('workspace_id', 'customer_packages_workspace_id_foreign')
                    ->references('id')
                    ->on('workspaces')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // ---------------------------------------------------------------
        // Drop FKs first (MySQL only), then indexes, then columns
        // Order matters: FKs must be removed before the column they reference
        // ---------------------------------------------------------------
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
