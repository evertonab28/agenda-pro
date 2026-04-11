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
        // This migration depends on cancellation_reason being added first.
        // The column should be added by 2026_04_09_175548, but that migration runs after this one.
        // We need to check if cancellation_reason exists before adding these columns.
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            // Only add these columns if the table structure supports it
            // This is a workaround for migration ordering issues
            if (!Schema::hasColumn('workspace_subscriptions', 'cancellation_recorded_at')) {
                // Check if we need to add cancellation_reason first
                if (!Schema::hasColumn('workspace_subscriptions', 'cancellation_reason')) {
                    $table->text('cancellation_reason')->nullable()->after('canceled_at');
                }
                $table->timestamp('cancellation_recorded_at')->nullable()->after('cancellation_reason');
                $table->string('canceled_by')->nullable()->after('cancellation_recorded_at')->comment('customer, admin, system');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['cancellation_recorded_at', 'canceled_by']);
        });
    }
};
