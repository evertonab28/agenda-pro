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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('clinic_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('clinic_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('clinic_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('charges', function (Blueprint $table) {
            $table->foreignId('clinic_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
