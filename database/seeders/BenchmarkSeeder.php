<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BenchmarkSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Limpando dados anteriores...');
        DB::statement('PRAGMA foreign_keys=OFF;');
        DB::table('charges')->truncate();
        DB::table('appointments')->truncate();
        DB::table('customers')->truncate();
        DB::table('services')->truncate();
        DB::statement('PRAGMA foreign_keys=ON;');

        $this->command->info('Criando 50 Clientes e 10 Serviços...');
        $customers = [];
        for ($i = 1; $i <= 50; $i++) {
            $customers[] = [
                'name' => "Cliente Benchmark $i", 
                'email' => "cliente$i@bench.com", 
                'phone' => "6799" . str_pad($i, 5, '0', STR_PAD_LEFT),
                'created_at' => now(), 
                'updated_at' => now()
            ];
        }
        DB::table('customers')->insert($customers);

        $services = [];
        for ($i = 1; $i <= 10; $i++) {
            $services[] = ['name' => "Serviço VIP $i", 'price' => 100 + ($i * 10), 'duration_minutes' => 60, 'created_at' => now(), 'updated_at' => now()];
        }
        DB::table('services')->insert($services);

        $this->command->info('Criando 10.000 Agendamentos e Faturas espalhados no ano...');
        $appointments = [];
        $charges = [];
        
        $customerIds = DB::table('customers')->pluck('id')->toArray();
        $serviceIds = DB::table('services')->pluck('id')->toArray();
        $baseDate = Carbon::now()->startOfYear();
        
        for ($i = 1; $i <= 10000; $i++) {
            $randDays = rand(0, 360);
            $appDate = (clone $baseDate)->addDays($randDays)->addHours(rand(8, 18));
            $status = ['confirmed', 'completed', 'no_show', 'canceled'][rand(0, 3)];
            
            $appointments[] = [
                'customer_id' => $customerIds[array_rand($customerIds)],
                'service_id' => $serviceIds[array_rand($serviceIds)],
                'starts_at' => $appDate,
                'ends_at' => (clone $appDate)->addHour(),
                'status' => $status,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($appointments) >= 1000) {
                DB::table('appointments')->insert($appointments);
                $appointments = [];
            }
        }
        
        if (count($appointments) > 0) {
            DB::table('appointments')->insert($appointments);
        }

        $appts = DB::table('appointments')->select('id', 'starts_at')->get();
        foreach ($appts as $app) {
            $cStatus = ['paid', 'pending', 'overdue'][rand(0, 2)];
            $charges[] = [
                'appointment_id' => $app->id,
                'amount' => rand(50, 500),
                'status' => $cStatus,
                'due_date' => Carbon::parse($app->starts_at)->addDays(5),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($charges) >= 1000) {
                DB::table('charges')->insert($charges);
                $charges = [];
            }
        }

        if (count($charges) > 0) {
            DB::table('charges')->insert($charges);
        }

        $this->command->info('BenchmarkSeeder concluído com sucesso!');
    }
}
