<?php

namespace Database\Factories;

use App\Models\Charge;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChargeFactory extends Factory
{
    protected $model = Charge::class;

    public function definition()
    {
        return [
            'description' => $this->faker->sentence(3),
            'customer_id' => Customer::factory(),
            'amount' => $this->faker->randomFloat(2, 50, 500),
            'status' => $this->faker->randomElement(['pending', 'partial', 'paid', 'overdue', 'cancelled']),
            'due_date' => $this->faker->dateTimeBetween('-1 month', '+1 month')->format('Y-m-d'),
            'payment_method' => $this->faker->randomElement(['pix', 'dinheiro', 'cartao', 'boleto']),
            'notes' => $this->faker->optional()->sentence,
        ];
    }
}
