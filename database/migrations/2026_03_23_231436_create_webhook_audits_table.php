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
            $table->string('provider');
            $table->string('event_id')->index();
            $table->timestamp('processed_at')->useCurrent();
            
            $table->unique(['provider', 'event_id']);
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
