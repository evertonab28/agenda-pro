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
            // Index for faster lookups when syncing with appointments
            $table->index(['appointment_id', 'status']);
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->index(['charge_id', 'received_at']);
        });
    }

    public function down(): void
    {
        Schema::table('charges', function (Blueprint $table) {
            $table->dropIndex(['appointment_id', 'status']);
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->dropIndex(['charge_id', 'received_at']);
        });
    }
};
