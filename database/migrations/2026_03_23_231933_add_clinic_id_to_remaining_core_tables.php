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
        Schema::table('services', function (Blueprint $table) {
            $table->foreignId('clinic_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('professionals', function (Blueprint $table) {
            $table->foreignId('clinic_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('packages', function (Blueprint $table) {
            $table->foreignId('clinic_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
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
};
