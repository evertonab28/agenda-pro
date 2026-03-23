<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Wallets
        Schema::create('wallets', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('customer_id')->unique()->constrained()->onDelete('cascade');
            $blueprint->decimal('balance', 12, 2)->default(0);
            $blueprint->timestamps();
        });

        // Wallet Transactions
        Schema::create('wallet_transactions', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('wallet_id')->constrained()->onDelete('cascade');
            $blueprint->decimal('amount', 12, 2);
            $blueprint->string('type'); // credit, debit
            $blueprint->string('description')->nullable();
            $blueprint->string('reference_type')->nullable(); // appointment, charge, package
            $blueprint->unsignedBigInteger('reference_id')->nullable();
            $blueprint->timestamps();
        });

        // Packages (Templates)
        Schema::create('packages', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('service_id')->constrained()->onDelete('cascade');
            $blueprint->string('name');
            $blueprint->text('description')->nullable();
            $blueprint->integer('sessions_count');
            $blueprint->decimal('price', 12, 2);
            $blueprint->integer('validity_days')->default(90);
            $blueprint->boolean('is_active')->default(true);
            $blueprint->timestamps();
        });

        // Customer's purchased packages
        Schema::create('customer_packages', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('customer_id')->constrained()->onDelete('cascade');
            $blueprint->foreignId('package_id')->constrained()->onDelete('cascade');
            $blueprint->integer('remaining_sessions');
            $blueprint->date('expires_at')->nullable();
            $blueprint->string('status')->default('active'); // active, expired, exhausted, canceled
            $blueprint->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_packages');
        Schema::dropIfExists('packages');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
