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
            if (!Schema::hasColumn('workspace_subscriptions', 'cancellation_category')) {
                $table->string('cancellation_category')->nullable()->after('canceled_at');
            }
            if (!Schema::hasColumn('workspace_subscriptions', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable()->after('cancellation_category');
            }
            if (!Schema::hasColumn('workspace_subscriptions', 'winback_candidate')) {
                $table->boolean('winback_candidate')->default(false)->after('cancellation_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'cancellation_category',
                'cancellation_reason',
                'winback_candidate',
            ]);
        });
    }
};
