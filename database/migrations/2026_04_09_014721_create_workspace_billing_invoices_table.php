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
        Schema::create('workspace_billing_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained('workspace_subscriptions')->onDelete('set null');
            $table->foreignId('plan_id')->constrained('plans')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending'); // pending, paid, overdue, canceled
            $table->string('provider')->default('asaas');
            $table->string('provider_invoice_id')->nullable();
            $table->text('provider_payment_link')->nullable();
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->string('reference_period');
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workspace_billing_invoices');
    }
};
