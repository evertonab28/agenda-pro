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
        Schema::table('workspaces', function (Blueprint $table) {
            // Appearance & Themes (Consolidated)
            if (!Schema::hasColumn('workspaces', 'theme_preset')) {
                $table->string('theme_preset')->default('slate')->after('status');
            }
            if (!Schema::hasColumn('workspaces', 'primary_color')) {
                $table->string('primary_color')->nullable()->after('theme_preset');
            }
            if (!Schema::hasColumn('workspaces', 'secondary_color')) {
                $table->string('secondary_color')->nullable()->after('primary_color');
            }

            // Scheduling Rules
            if (!Schema::hasColumn('workspaces', 'min_advance_hours')) {
                $table->unsignedSmallInteger('min_advance_hours')->nullable()->after('secondary_color');
            }
            if (!Schema::hasColumn('workspaces', 'max_advance_days')) {
                $table->unsignedSmallInteger('max_advance_days')->nullable()->after('min_advance_hours');
            }

            // Public Profile & Branding
            if (!Schema::hasColumn('workspaces', 'public_name')) {
                $table->string('public_name')->nullable()->after('name');
                $table->text('public_description')->nullable()->after('public_name');
                $table->string('logo_url')->nullable()->after('public_description');
                $table->string('cover_url')->nullable()->after('logo_url');
            }

            // Location & Address
            if (!Schema::hasColumn('workspaces', 'address_street')) {
                $table->string('address_street')->nullable()->after('cover_url');
                $table->string('address_number')->nullable()->after('address_street');
                $table->string('address_complement')->nullable()->after('address_number');
                $table->string('address_district')->nullable()->after('address_complement');
                $table->string('address_city')->nullable()->after('address_district');
                $table->string('address_state', 2)->nullable()->after('address_city');
                $table->string('address_zip', 10)->nullable()->after('address_state');
                $table->decimal('latitude', 10, 8)->nullable()->after('address_zip');
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }

            // Contact & Social
            if (!Schema::hasColumn('workspaces', 'whatsapp_number')) {
                $table->string('whatsapp_number')->nullable()->after('longitude');
            }
            if (!Schema::hasColumn('workspaces', 'instagram_handle')) {
                $table->string('instagram_handle')->nullable()->after('whatsapp_number');
            }

            // Instagram Hybrid Feed
            if (!Schema::hasColumn('workspaces', 'instagram_feed_mode')) {
                $table->string('instagram_feed_mode')->default('manual')->after('instagram_handle');
            }
            if (!Schema::hasColumn('workspaces', 'instagram_feed_widget_url')) {
                $table->text('instagram_feed_widget_url')->nullable()->after('instagram_feed_mode');
            }

            // Flags
            if (!Schema::hasColumn('workspaces', 'show_location')) {
                $table->boolean('show_location')->default(true)->after('instagram_feed_widget_url');
            }
            if (!Schema::hasColumn('workspaces', 'show_contact_button')) {
                $table->boolean('show_contact_button')->default(true)->after('show_location');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'theme_mode')) {
                $table->string('theme_mode')->default('system')->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn([
                'theme_preset', 'primary_color', 'secondary_color',
                'min_advance_hours', 'max_advance_days',
                'public_name', 'public_description', 'logo_url', 'cover_url',
                'address_street', 'address_number', 'address_complement', 'address_district', 
                'address_city', 'address_state', 'address_zip', 'latitude', 'longitude',
                'whatsapp_number', 'instagram_handle', 'instagram_feed_mode', 'instagram_feed_widget_url',
                'show_location', 'show_contact_button'
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('theme_mode');
        });
    }
};
