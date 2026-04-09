<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('professional_id')
                ->nullable()
                ->after('service_id')
                ->constrained('users')
                ->nullOnDelete();

            $table->index(['professional_id', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['professional_id']);
            $table->dropIndex('appointments_professional_id_starts_at_index');
            $table->dropColumn('professional_id');
        });
    }
};