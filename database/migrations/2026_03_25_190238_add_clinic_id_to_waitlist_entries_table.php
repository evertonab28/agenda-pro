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

        Schema::table('waitlist_entries', function (Blueprint $table) use ($refTable) {
            $table->foreignId('clinic_id')->nullable()->after('id')->references('id')->on($refTable)->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('waitlist_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('clinic_id');
        });
    }
};
