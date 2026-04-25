<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            // Profile & Branding
            $table->string('public_name')->nullable();
            $table->text('public_description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('cover_url')->nullable();

            // Location
            $table->string('address_street')->nullable();
            $table->string('address_number')->nullable();
            $table->string('address_complement')->nullable();
            $table->string('address_district')->nullable();
            $table->string('address_city')->nullable();
            $table->string('address_state', 2)->nullable();
            $table->string('address_zip', 10)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            // Contact & Social
            $table->string('whatsapp_number')->nullable();
            $table->string('instagram_handle')->nullable();

            // Flags
            $table->boolean('show_location')->default(true);
            $table->boolean('show_contact_button')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn([
                'public_name', 'public_description', 'logo_url', 'cover_url',
                'address_street', 'address_number', 'address_complement', 'address_district', 
                'address_city', 'address_state', 'address_zip', 'latitude', 'longitude',
                'whatsapp_number', 'instagram_handle', 'show_location', 'show_contact_button'
            ]);
        });
    }
};
