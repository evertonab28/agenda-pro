<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('webhook_audits', function (Blueprint $table) {
            $table->dropUnique(['provider', 'event_id']);
        });

        Schema::table('webhook_audits', function (Blueprint $table) {
            $table->unsignedBigInteger('workspace_id')->nullable()->after('id');
            $table->string('type')->nullable()->after('provider');
            $table->index(['workspace_id', 'provider', 'type', 'event_id'], 'webhook_audits_scope_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::table('webhook_audits', function (Blueprint $table) {
            $table->dropIndex('webhook_audits_scope_lookup_idx');
            $table->dropColumn('workspace_id');
            $table->dropColumn('type');
            $table->unique(['provider', 'event_id']);
        });
    }
};
