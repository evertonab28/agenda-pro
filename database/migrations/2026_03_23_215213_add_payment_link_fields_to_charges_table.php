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
        Schema::table('charges', function (Blueprint $table) {
            $table->string('payment_link_hash')->nullable()->unique()->after('status');
            $table->integer('payment_link_clicks')->default(0)->after('payment_link_hash');
            $table->timestamp('payment_link_expires_at')->nullable()->after('payment_link_clicks');
            $table->string('payment_provider_id')->nullable()->after('payment_link_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('charges', function (Blueprint $table) {
            $table->dropColumn([
                'payment_link_hash',
                'payment_link_clicks',
                'payment_link_expires_at',
                'payment_provider_id'
            ]);
        });
    }
};
