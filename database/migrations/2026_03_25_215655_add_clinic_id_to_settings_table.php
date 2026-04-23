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
        $refTable = Schema::hasTable('clinics') ? 'clinics' : 'workspaces';

        Schema::table('settings', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->references('id')->on($refTable)->onDelete('cascade');
            $table->unique(['clinic_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['clinic_id', 'key']);
            $table->dropColumn('clinic_id');
        });
    }
};
