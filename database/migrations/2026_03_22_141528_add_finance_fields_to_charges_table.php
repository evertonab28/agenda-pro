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
        Schema::table('charges', function (Blueprint $table) {
            $table->string('description')->after('id')->nullable();
            $table->foreignId('customer_id')->nullable()->after('appointment_id')->constrained()->nullOnDelete();
            $table->text('notes')->nullable()->after('external_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('charges', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['description', 'customer_id', 'notes']);
        });
    }
};
