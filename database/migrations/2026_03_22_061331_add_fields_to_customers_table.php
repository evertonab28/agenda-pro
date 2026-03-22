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
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'document')) {
                $table->string('document')->nullable()->after('email');
            }
            if (!Schema::hasColumn('customers', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('document');
            }
            if (!Schema::hasColumn('customers', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('notes')->index();
            }
            if (!Schema::hasColumn('customers', 'deleted_at')) {
                $table->softDeletes();
            }
            
            // Indexes are a bit trickier in some DBs but we can try to add if not caught by column index()
            // In SQLite, adding an index on an existing column might fail if it already exists.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['document', 'birth_date', 'is_active']);
            $table->dropSoftDeletes();
        });
    }
};
