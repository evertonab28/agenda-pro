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
            $table->index('payment_provider_id');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->index('public_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('charges', function (Blueprint $table) {
            $table->dropIndex(['payment_provider_id']);
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['public_token']);
        });
    }
};
