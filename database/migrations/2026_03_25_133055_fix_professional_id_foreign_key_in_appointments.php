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
        Schema::table('appointments', function (Blueprint $table) {
            // Check if we are running in tests (SQLite)
            if (config('database.default') === 'sqlite') {
                // SQLite doesn't support dropping foreign keys easily, but for tests we can just re-define it if needed
                // Actually, standard Laravel way works in most modern SQLite versions used by Laravel
            }
            $table->dropForeign(['professional_id']);
            $table->foreign('professional_id')->references('id')->on('professionals')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['professional_id']);
            $table->foreign('professional_id')->references('id')->on('users')->nullOnDelete();
        });
    }
};
