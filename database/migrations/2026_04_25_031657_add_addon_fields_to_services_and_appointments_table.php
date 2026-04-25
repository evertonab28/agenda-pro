<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->boolean('is_addon')->default(false)->after('is_active');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->decimal('total_price', 10, 2)->nullable()->after('ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('is_addon');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('total_price');
        });
    }
};
