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
        // Add addon flag to services
        Schema::table('services', function (Blueprint $table) {
            if (!Schema::hasColumn('services', 'is_addon')) {
                $table->boolean('is_addon')->default(false)->after('is_active');
            }
        });

        // Add total price to appointments
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'total_price')) {
                $table->decimal('total_price', 10, 2)->nullable()->after('ends_at');
            }
        });

        // Create appointment items table (for main service + addons)
        if (!Schema::hasTable('appointment_items')) {
            Schema::create('appointment_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
                $table->foreignId('service_id')->nullable()->constrained()->onDelete('set null');
                $table->string('name');
                $table->decimal('price', 10, 2);
                $table->integer('duration_minutes');
                $table->boolean('is_main')->default(false);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_items');

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('total_price');
        });

        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('is_addon');
        });
    }
};
