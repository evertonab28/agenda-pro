<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PlanSeeder::class);
        
        $workspace = \App\Models\Workspace::updateOrCreate(
            ['slug' => 'workspace-modelo'],
            ['name' => 'Workspace Modelo', 'status' => 'active']
        );

        // Ensure subscription if observer didn't fire (e.g. on update)
        if ($workspace->subscriptions()->count() === 0) {
            $plan = \App\Models\Plan::where('slug', 'starter')->first();
            if ($plan) {
                $workspace->subscriptions()->create([
                    'plan_id' => $plan->id,
                    'status' => 'trialing',
                    'trial_ends_at' => now()->addDays(14),
                    'starts_at' => now(),
                ]);
            }
        }

        User::updateOrCreate(
            ['email' => 'admin@agendapro.com.br'],
            [
                'name' => 'Admin Agenda Pro',
                'password' => \Illuminate\Support\Facades\Hash::make('AgendaPro@2026'),
                'role' => 'admin',
                'workspace_id' => $workspace->id,
            ]
        );

        $customer = \App\Models\Customer::updateOrCreate(
            ['email' => 'test@example.com', 'workspace_id' => $workspace->id],
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
