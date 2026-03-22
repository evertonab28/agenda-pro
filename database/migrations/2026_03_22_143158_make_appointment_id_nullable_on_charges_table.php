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
            $table->foreignId('appointment_id')->nullable()->change();
            // SQLite doesn't directly support enum changes, so we will use string for status to be safe.
            $table->string('status')->default('pending')->change(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('charges', function (Blueprint $table) {
            $table->foreignId('appointment_id')->nullable(false)->change();
        });
    }
};
