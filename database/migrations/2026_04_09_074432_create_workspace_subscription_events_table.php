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
        Schema::create('workspace_subscription_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->constrained('workspace_subscriptions')->onDelete('cascade');
            $table->string('event_type'); // trialled_ended, invoice_generated, payment_received, overdue, reactivated, canceled
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_subscription_events');
    }
};
