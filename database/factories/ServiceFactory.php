<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->word,
            'duration_minutes' => $this->faker->randomElement([30, 60, 90]),
            'price' => $this->faker->randomFloat(2, 50, 200),
            'active' => true,
        ];
    }
}
