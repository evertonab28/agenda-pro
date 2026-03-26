<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $clinic = \App\Models\Clinic::updateOrCreate(
            ['slug' => 'clinica-modelo'],
            ['name' => 'Clínica Modelo', 'status' => 'active']
        );

        User::updateOrCreate(
            ['email' => 'admin@agendapro.com.br'],
            [
                'name' => 'Admin Agenda Pro',
                'password' => \Illuminate\Support\Facades\Hash::make('AgendaPro@2026'),
                'role' => 'admin',
                'clinic_id' => $clinic->id,
            ]
        );

        $customer = \App\Models\Customer::updateOrCreate(
            ['email' => 'test@example.com', 'clinic_id' => $clinic->id],
            [
                'name' => 'Cliente Teste',
                'phone' => '11988887777',
            ]
        );

        // Ensure professional is linked to services
        $professional = \App\Models\Professional::first();
        if ($professional) {
            $professional->services()->sync(\App\Models\Service::pluck('id'));
        }
    }
}
