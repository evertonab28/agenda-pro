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

        Schema::create('crm_actions', function (Blueprint $table) use ($refTable) {
            $table->id();
            $table->foreignId('clinic_id')->references('id')->on($refTable)->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // 'reengagement', 'loyalty', 'review', etc.
            $table->string('status')->default('pending'); // 'pending', 'done', 'dismissed'
            $table->string('priority')->default('medium');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('action_data')->nullable(); // Metadata for the action (e.g. discount coupon)
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();

            $table->index(['clinic_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_actions');
    }
};
