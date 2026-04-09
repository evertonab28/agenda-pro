<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'customer_id' => function (array $attributes) {
                return Customer::factory()->create(['workspace_id' => $attributes['workspace_id']])->id;
            },
            'service_id' => function (array $attributes) {
                return Service::factory()->create(['workspace_id' => $attributes['workspace_id']])->id;
            },
            'professional_id' => function (array $attributes) {
                return \App\Models\Professional::factory()->create(['workspace_id' => $attributes['workspace_id']])->id;
            },
            'starts_at' => now()->addHour(),
            'ends_at' => now()->addHours(2),
            'status' => 'scheduled',
        ];
    }
}
