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
        Schema::table('services', function (Blueprint $table) {
            if (Schema::hasColumn('services', 'active') && !Schema::hasColumn('services', 'is_active')) {
                $table->renameColumn('active', 'is_active');
            }
            if (!Schema::hasColumn('services', 'color')) {
                $table->string('color')->nullable()->after('price');
            }
            if (!Schema::hasColumn('services', 'description')) {
                $table->text('description')->nullable()->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            if (Schema::hasColumn('services', 'is_active') && !Schema::hasColumn('services', 'active')) {
                $table->renameColumn('is_active', 'active');
            }
            $table->dropColumn(['color', 'description']);
        });
    }
};
