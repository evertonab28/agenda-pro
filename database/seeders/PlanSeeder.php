<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'price' => 49.90,
                'billing_cycle' => 'monthly',
                'features' => [
                    'max_professionals' => 1,
                    'max_users' => 2,
                    'executive_bi' => false,
                    'crm_tools' => false,
                    'data_export' => false,
                    'integrations_access' => ['asaas'],
                ],
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'price' => 99.90,
                'billing_cycle' => 'monthly',
                'features' => [
                    'max_professionals' => 5,
                    'max_users' => 10,
                    'executive_bi' => true,
                    'crm_tools' => true,
                    'data_export' => true,
                    'integrations_access' => ['asaas', 'evolution'],
                ],
            ],
            [
                'name' => 'Scale',
                'slug' => 'scale',
                'price' => 199.90,
                'billing_cycle' => 'monthly',
                'features' => [
                    'max_professionals' => 50,
                    'max_users' => 100,
                    'executive_bi' => true,
                    'crm_tools' => true,
                    'data_export' => true,
                    'integrations_access' => ['asaas', 'evolution'],
                ],
            ],
        ];

        foreach ($plans as $plan) {
            \App\Models\Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
