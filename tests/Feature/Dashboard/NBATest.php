<?php

namespace Tests\Feature\Dashboard;

use App\Models\User;
use App\Models\Charge;
use App\Models\Customer;
use App\Services\DashboardService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NBATest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_prioritizes_d_plus_3_over_d_plus_1()
    {
        $today = Carbon::parse('2026-03-24 10:00:00');
        Carbon::setTestNow($today);

        $customer = Customer::factory()->create();

        // D+1 (Vencido ontem)
        Charge::create([
            'customer_id' => $customer->id,
            'amount' => 100,
            'status' => 'overdue',
            'due_date' => $today->clone()->subDay()->toDateString(),
        ]);

        // D+3 (Vencido há 3 dias)
        Charge::create([
            'customer_id' => $customer->id,
            'amount' => 200,
            'status' => 'overdue',
            'due_date' => $today->clone()->subDays(3)->toDateString(),
        ]);

        $service = new DashboardService();
        $actions = $service->getDailyActions();

        // No nosso algoritmo, high priority (D+3+) vem primeiro
        $this->assertEquals('high', $actions[0]['priority']);
        $this->assertEquals(200, $actions[0]['amount']);
    }

    /** @test */
    public function it_filters_out_paid_and_canceled_charges_from_nba()
    {
        $customer = Customer::factory()->create();

        Charge::create([
            'customer_id' => $customer->id,
            'amount' => 100,
            'status' => 'paid',
            'due_date' => now()->subDays(5),
            'paid_at' => now(),
        ]);

        $service = new DashboardService();
        $actions = $service->getDailyActions();

        $this->assertEmpty($actions);
    }

    /** @test */
    public function it_respects_timezone_for_daily_actions()
    {
        // Meia noite em SP = 03:00 UTC
        $todaySP = Carbon::parse('2026-03-24 00:01:00', 'America/Sao_Paulo');
        Carbon::setTestNow($todaySP);

        $customer = Customer::factory()->create();
        
        // Vence "hoje" (dia 24)
        Charge::create([
            'customer_id' => $customer->id,
            'amount' => 50,
            'status' => 'pending',
            'due_date' => $todaySP->clone()->toDateString(),
        ]);

        $service = new DashboardService();
        $actions = $service->getDailyActions();

        $this->assertCount(1, $actions);
        $this->assertEquals('Hoje', $actions[0]['due_date']);
    }
}
