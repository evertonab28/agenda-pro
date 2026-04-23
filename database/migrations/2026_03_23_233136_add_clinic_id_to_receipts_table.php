<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $refTable = Schema::hasTable('clinics') ? 'clinics' : 'workspaces';

        Schema::table('receipts', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // WARNING (Sprint T4): This down() has an empty body — it does not drop
        // the clinic_id column added in up(). Rolling back will leave clinic_id
        // in the receipts table.
        //
        // DO NOT use migrate:rollback past this point in any environment with data.
        // In ephemeral environments (CI/CD), use `migrate:fresh` instead.
        //
        // Ref: docs/db/migration-audit.md — "Sprint T4 — Hardening Audit"
        Schema::table('receipts', function (Blueprint $table) {
            //
        });
    }
};
