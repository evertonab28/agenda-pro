<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('charges', function (Blueprint $table) {
$table->id();
$table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
$table->string('description')->nullable();
$table->foreignId('appointment_id')->nullable()->unique()->constrained()->cascadeOnDelete();
$table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();

$table->decimal('amount', 10, 2);
$table->unsignedInteger('reference_month')->nullable();
$table->unsignedInteger('reference_year')->nullable();
$table->enum('status', ['pending', 'paid', 'overdue', 'canceled', 'partial'])->default('pending')->index();
$table->string('payment_link_hash')->nullable()->unique();
$table->integer('payment_link_clicks')->default(0);
$table->timestamp('payment_link_expires_at')->nullable();
$table->string('payment_provider_id')->nullable()->index();

$table->date('due_date')->index();
$table->dateTime('paid_at')->nullable();
$table->enum('payment_method', ['pix', 'cash', 'card', 'transfer'])->nullable();
$table->string('external_reference')->nullable();
$table->text('notes')->nullable();
$table->string('reference_type')->nullable();
$table->unsignedBigInteger('reference_id')->nullable();

$table->timestamps();

$table->index(['appointment_id', 'status']);
$table->index(['reference_type', 'reference_id']);
});
}

public function down(): void
{
Schema::dropIfExists('charges');
}
};
