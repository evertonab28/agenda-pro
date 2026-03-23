<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');          // e.g. appointment.created
            $table->string('entity');          // e.g. Appointment
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('payload')->nullable(); // non-sensitive extra context
            $table->ipAddress('ip')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity', 'entity_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
