<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('appointments', function (Blueprint $table) {
$table->id();
$table->foreignId('customer_id')->constrained()->cascadeOnDelete();
$table->foreignId('service_id')->constrained()->restrictOnDelete();

$table->dateTime('starts_at')->index();
$table->dateTime('ends_at');

$table->enum('status', [
'scheduled',
'confirmed',
'no_show',
'completed',
'canceled',
'rescheduled',
])->default('scheduled')->index();

$table->string('confirmation_token')->nullable()->unique();
$table->dateTime('confirmed_at')->nullable();

$table->enum('source', ['admin', 'public_link'])->default('admin');
$table->text('notes')->nullable();

$table->timestamps();

$table->index(['customer_id', 'starts_at']);
});
}

public function down(): void
{
Schema::dropIfExists('appointments');
}
};