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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('charge_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount_received', 12, 2);
            $table->decimal('fee_amount', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2);
            $table->string('method');
            $table->datetime('received_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
