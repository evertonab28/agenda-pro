<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('appointments', function (Blueprint $table) {
$table->id();
$table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
$table->foreignId('customer_id')->constrained()->cascadeOnDelete();
$table->foreignId('service_id')->constrained()->restrictOnDelete();
$table->foreignId('professional_id')->nullable()->constrained('professionals')->cascadeOnDelete();

$table->dateTime('starts_at')->index();
$table->dateTime('ends_at');
$table->dateTime('buffered_ends_at')->nullable()->index();

$table->enum('status', [
'scheduled',
'confirmed',
'no_show',
'completed',
'canceled',
'rescheduled',
])->default('scheduled')->index();

$table->string('confirmation_token')->nullable()->unique();
$table->string('public_token')->nullable()->unique();
$table->dateTime('confirmed_at')->nullable();

$table->enum('source', ['admin', 'public_link'])->default('admin');
$table->text('notes')->nullable();
$table->text('cancel_reason')->nullable();
$table->unsignedTinyInteger('nps_score')->nullable();
$table->text('nps_comment')->nullable();

$table->timestamps();

$table->index(['customer_id', 'starts_at']);
$table->index(['professional_id', 'starts_at']);
$table->index(['service_id', 'starts_at']);
});
}

public function down(): void
{
Schema::dropIfExists('appointments');
}
};
