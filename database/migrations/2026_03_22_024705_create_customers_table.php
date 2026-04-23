<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('customers', function (Blueprint $table) {
$table->id();
$table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
$table->string('name');
$table->string('phone')->index();
$table->string('email')->nullable();
$table->string('document')->nullable();
$table->date('birth_date')->nullable();
$table->text('notes')->nullable();
$table->boolean('is_active')->default(true)->index();
$table->string('current_segment')->nullable()->index();
$table->timestamps();
$table->softDeletes();
});
}

public function down(): void
{
Schema::dropIfExists('customers');
}
};
