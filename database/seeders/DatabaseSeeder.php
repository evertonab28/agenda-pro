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
        $this->call(AdminUserSeeder::class);
        
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

        // Ensure all professionals are linked to services
        $allServiceIds = \App\Models\Service::withoutGlobalScopes()
            ->where('workspace_id', $workspace->id)
            ->pluck('id');

        $professionals = \App\Models\Professional::withoutGlobalScopes()
            ->where('workspace_id', $workspace->id)
            ->get();

        foreach ($professionals as $professional) {
            $professional->services()->syncWithoutDetaching($allServiceIds);
        }

        // Ensure all professionals have Mon–Sat schedules (09:00–18:00, break 12:00–13:00)
        // Uses updateOrCreate so re-seeding is idempotent.
        $weekdays = [1, 2, 3, 4, 5, 6]; // Mon–Sat

        foreach ($professionals as $professional) {
            foreach ($weekdays as $weekday) {
                \App\Models\ProfessionalSchedule::withoutGlobalScopes()->updateOrCreate(
                    [
                        'workspace_id'    => $workspace->id,
                        'professional_id' => $professional->id,
                        'weekday'         => $weekday,
                    ],
                    [
                        'start_time'  => '09:00:00',
                        'end_time'    => '18:00:00',
                        'break_start' => '12:00:00',
                        'break_end'   => '13:00:00',
                        'is_active'   => true,
                    ]
                );
            }
        }
    }
}
