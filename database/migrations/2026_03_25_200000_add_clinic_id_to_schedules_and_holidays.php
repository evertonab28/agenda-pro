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

        Schema::table('professional_schedules', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });

        Schema::table('holidays', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professional_schedules', function (Blueprint $table) {
            $table->dropForeign(['clinic_id']);
            $table->dropColumn('clinic_id');
        });

        Schema::table('holidays', function (Blueprint $table) {
            $table->dropForeign(['clinic_id']);
            $table->dropColumn('clinic_id');
        });
    }
};
