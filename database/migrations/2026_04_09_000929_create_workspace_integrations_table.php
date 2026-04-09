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
        Schema::create('workspace_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // 'payment', 'messaging'
            $table->string('provider'); // 'asaas', 'evolution'
            $table->text('credentials'); // encrypted payload
            $table->string('status')->default('active'); // 'active', 'inactive', 'error'
            $table->json('meta')->nullable();
            $table->timestamp('last_check_at')->nullable();
            $table->timestamps();

            // Uma integração de cada tipo por workspace (opcional, mas bom pra evitar overlap dependendo do design)
            $table->unique(['workspace_id', 'type', 'provider']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workspace_integrations');
    }
};
