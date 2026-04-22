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
        // This file is an empty placeholder that was accidentally committed.
        // The retention fields were added in later migrations:
        //   - 2026_04_09_151108: cancellation_recorded_at, canceled_by
        //   - 2026_04_09_175548: cancellation_category, cancellation_reason, winback_candidate
        //
        // DO NOT MODIFY — this migration is already recorded in all environment histories.
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            //
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Empty placeholder — nothing to revert. See comment in up().
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            //
        });
    }
};
