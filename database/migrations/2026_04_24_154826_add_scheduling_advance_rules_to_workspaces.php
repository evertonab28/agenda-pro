<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds scheduling advance-rule columns to the workspaces table.
 *
 * min_advance_hours: minimum hours in advance a public booking must be made.
 *   - 0 = no restriction (can book for any future slot)
 *   - Example: 2 = customer must book at least 2h before the appointment
 *
 * max_advance_days: how many days ahead public bookings are allowed.
 *   - 90 = customer can book up to 90 days from today (safe default)
 *   - Prevents calendar spam and slot pre-reservation abuse
 *
 * Both values are applied in PublicSchedulingController for both
 * getAvailability() (hides out-of-window slots) and store() (hard rejects).
 * NULL means "use application default" — always handled with null-coalescing in the controller.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->unsignedSmallInteger('min_advance_hours')->nullable()->after('theme_preset')
                ->comment('Minimum hours in advance for public bookings. NULL = 0 (no restriction).');
            $table->unsignedSmallInteger('max_advance_days')->nullable()->after('min_advance_hours')
                ->comment('Maximum days ahead allowed for public bookings. NULL = 90 days.');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn(['min_advance_hours', 'max_advance_days']);
        });
    }
};
