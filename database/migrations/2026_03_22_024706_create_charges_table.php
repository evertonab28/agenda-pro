<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('charges', function (Blueprint $table) {
$table->id();
$table->foreignId('appointment_id')->unique()->constrained()->cascadeOnDelete();

$table->decimal('amount', 10, 2);
$table->enum('status', ['pending', 'paid', 'overdue', 'canceled'])->default('pending')->index();

$table->date('due_date');
$table->dateTime('paid_at')->nullable();
$table->enum('payment_method', ['pix', 'cash', 'card', 'transfer'])->nullable();
$table->string('external_reference')->nullable();

$table->timestamps();
});
}

public function down(): void
{
Schema::dropIfExists('charges');
}
};