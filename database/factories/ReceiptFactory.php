<?php

namespace Database\Factories;

use App\Models\Receipt;
use App\Models\Charge;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReceiptFactory extends Factory
{
    protected $model = Receipt::class;

    public function definition()
    {
        return [
            'charge_id' => Charge::factory(),
            'amount_received' => $this->faker->randomFloat(2, 10, 100),
            'fee_amount' => $this->faker->randomFloat(2, 0, 5),
            'net_amount' => function (array $attributes) {
                return $attributes['amount_received'] - $attributes['fee_amount'];
            },
            'method' => $this->faker->randomElement(['pix', 'dinheiro', 'cartao', 'boleto']),
            'received_at' => $this->faker->dateTimeThisMonth(),
            'notes' => $this->faker->optional()->sentence,
        ];
    }
}
