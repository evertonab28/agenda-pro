<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
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
            'name' => $this->faker->name,
            'phone' => $this->faker->numerify('###########'), // 11 digits
            'email' => $this->faker->unique()->safeEmail,
            'document' => $this->faker->numerify('###########'), // 11 digits for CPF
            'birth_date' => $this->faker->date(),
            'is_active' => true,
            'notes' => $this->faker->sentence,
        ];
    }
}
