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

        Schema::table('users', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });

        Schema::table('customers', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });

        Schema::table('appointments', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });

        Schema::table('charges', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // WARNING (Sprint T4): This down() is incomplete — only wraps the users table, omitting customers, appointments, and charges.
        // The up() added clinic_id to users, customers, appointments, charges.
        // Rolling back these columns requires manual intervention — this migration
        // was committed to production before down() was fully implemented.
        //
        // DO NOT use migrate:rollback past this point in any environment with data.
        // In ephemeral environments (CI/CD), use `migrate:fresh` instead.
        //
        // Ref: docs/db/migration-audit.md — "Sprint T4 — Hardening Audit"
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
