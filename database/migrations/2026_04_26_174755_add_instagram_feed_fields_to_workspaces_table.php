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
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('instagram_feed_mode')->default('manual')->after('instagram_handle');
            $table->text('instagram_feed_widget_url')->nullable()->after('instagram_feed_mode');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['instagram_feed_mode', 'instagram_feed_widget_url']);
        });
    }
};
