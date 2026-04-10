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
        // Este arquivo é um placeholder vazio commitado acidentalmente.
        // Os campos de retenção foram adicionados em migrations posteriores:
        //   - 2026_04_09_175548: cancellation_category, cancellation_reason, winback_candidate
        //   - 2026_04_09_151108: cancellation_recorded_at, canceled_by
        //
        // NÃO ALTERAR — já foi registrado no histórico de migrations de todos os ambientes.
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            //
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Placeholder vazio — nada a reverter. Ver comentário em up().
        Schema::table('workspace_subscriptions', function (Blueprint $table) {
            //
        });
    }
};
