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
        // Weekly schedules for professionals
        Schema::create('professional_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('weekday'); // 0 (Sunday) to 6 (Saturday)
            $table->time('start_time')->default('09:00:00');
            $table->time('end_time')->default('18:00:00');
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['professional_id', 'weekday']);
        });

        // Holidays and Blocked Dates
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('date');
            $table->foreignId('professional_id')->nullable()->constrained()->onDelete('cascade');
            $table->boolean('repeats_yearly')->default(false);
            $table->timestamps();
        });

        // Global System Settings
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('professional_schedules');
    }
};
