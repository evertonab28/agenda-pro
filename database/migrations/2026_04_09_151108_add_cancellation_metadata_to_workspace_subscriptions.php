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
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('workspace_subscriptions', 'cancellation_recorded_at')) {
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
