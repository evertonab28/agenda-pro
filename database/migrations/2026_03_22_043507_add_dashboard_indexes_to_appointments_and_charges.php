<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->index('starts_at', 'idx_appts_starts_at');
            $table->index('status', 'idx_appts_status');
            $table->index(['professional_id', 'starts_at'], 'idx_appts_prof_starts_at');
            $table->index(['service_id', 'starts_at'], 'idx_appts_serv_starts_at');
        });

        Schema::table('charges', function (Blueprint $table) {
            $table->index('status', 'idx_charges_status');
            $table->index('due_date', 'idx_charges_due_date');
            $table->index(['appointment_id', 'status'], 'idx_charges_appt_status');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appts_starts_at');
            $table->dropIndex('idx_appts_status');
            $table->dropIndex('idx_appts_prof_starts_at');
            $table->dropIndex('idx_appts_serv_starts_at');
        });

        Schema::table('charges', function (Blueprint $table) {
            $table->dropIndex('idx_charges_status');
            $table->dropIndex('idx_charges_due_date');
            $table->dropIndex('idx_charges_appt_status');
        });
    }
};
