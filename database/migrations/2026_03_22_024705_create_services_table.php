<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
public function up(): void
{
Schema::create('services', function (Blueprint $table) {
$table->id();
$table->foreignId('workspace_id')->nullable()->constrained()->cascadeOnDelete();
$table->string('name');
$table->unsignedInteger('duration_minutes');
$table->unsignedInteger('buffer_minutes')->default(0);
$table->decimal('price', 10, 2);
$table->string('color')->nullable();
$table->boolean('is_active')->default(true);
$table->text('description')->nullable();
$table->timestamps();
});
}

public function down(): void
{
Schema::dropIfExists('services');
}
};
