<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('reminder_logs', function (Blueprint $table) {
$table->id();

$table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
$table->foreignId('charge_id')->nullable()->constrained()->nullOnDelete();

$table->enum('type', [
'confirm_d1',
'confirm_h2',
'charge_d1',
'charge_d3',
'reactivation',
])->index();

$table->enum('channel', ['whatsapp', 'telegram', 'sms']);
$table->json('payload')->nullable();

$table->dateTime('sent_at')->nullable();
$table->enum('status', ['queued', 'sent', 'failed'])->default('queued')->index();
$table->text('error_message')->nullable();

$table->timestamps();
});
}

public function down(): void
{
Schema::dropIfExists('reminder_logs');
}
};