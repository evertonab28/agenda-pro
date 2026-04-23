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
        Schema::create('webhook_audits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id')->nullable();
            $table->string('provider');
            $table->string('type')->nullable();
            $table->string('event_id')->index();
            $table->timestamp('processed_at')->useCurrent();

            $table->index(['workspace_id', 'provider', 'type', 'event_id'], 'webhook_audits_scope_lookup_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_audits');
    }
};
