<?php

namespace Tests\Feature;

use App\Models\Charge;
use App\Models\Receipt;
use App\Models\Service;
use App\Models\Customer;
use App\Models\Workspace;
use App\Models\Appointment;
use App\Models\Professional;
use App\Services\ReportingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportingTest extends TestCase
{
    use RefreshDatabase;

    protected $service;
    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->admin = \App\Models\User::factory()->create(['workspace_id' => $this->workspace->id, 'role' => 'admin']);
        $this->service = new ReportingService();
        $this->fulfillOnboarding($this->workspace->id);
    }

    public function test_financial_trend_calculates_correctly()
    {
        $this->actingAs($this->admin);

        // This month
        Charge::factory()->create([
            'workspace_id' => $this->workspace->id,
            'amount' => 1000,
            'due_date' => now(),
            'status' => 'paid'
        ]);
        Receipt::factory()->create([
            'workspace_id' => $this->workspace->id,
            'amount_received' => 1000,
            'received_at' => now()
        ]);

        // Last month
        $lastMonth = now()->subMonth();
        Charge::factory()->create([
            'workspace_id' => $this->workspace->id,
            'amount' => 500,
            'due_date' => $lastMonth,
            'status' => 'pending'
        ]);

        $trend = $this->service->getFinancialTrend($this->workspace->id, 2);

        $this->assertCount(2, $trend);
        $this->assertEquals(1000, $trend[1]['planned']);
        $this->assertEquals(1000, $trend[1]['actual']);
        $this->assertEquals(500, $trend[0]['planned']);
        $this->assertEquals(0, $trend[0]['actual']);
    }

    public function test_service_performance_ranking()
    {
        $serviceA = Service::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'Service A']);
        $serviceB = Service::factory()->create(['workspace_id' => $this->workspace->id, 'name' => 'Service B']);
        $prof = Professional::factory()->create();

        // Service A: 2 appointments
        $app1 = Appointment::factory()->create(['workspace_id' => $this->workspace->id, 'service_id' => $serviceA->id, 'status' => 'completed', 'professional_id' => $prof->id]);
        $app2 = Appointment::factory()->create(['workspace_id' => $this->workspace->id, 'service_id' => $serviceA->id, 'status' => 'completed', 'professional_id' => $prof->id]);
        
        Charge::factory()->create(['workspace_id' => $this->workspace->id, 'appointment_id' => $app1->id, 'amount' => 100, 'status' => 'paid']);
        Charge::factory()->create(['workspace_id' => $this->workspace->id, 'appointment_id' => $app2->id, 'amount' => 100, 'status' => 'paid']);

        // Service B: 1 appointment
        $app3 = Appointment::factory()->create(['workspace_id' => $this->workspace->id, 'service_id' => $serviceB->id, 'status' => 'completed', 'professional_id' => $prof->id]);
        Charge::factory()->create(['workspace_id' => $this->workspace->id, 'appointment_id' => $app3->id, 'amount' => 500, 'status' => 'paid']);

        $performance = $this->service->getServicePerformance($this->workspace->id);

        $this->assertEquals('Service B', $performance[0]['name']); // B has more revenue (500)
        $this->assertEquals(500, $performance[0]['revenue']);
        $this->assertEquals('Service A', $performance[1]['name']);
        $this->assertEquals(2, $performance[1]['count']);
    }

    public function test_customer_ltv_insights()
    {
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        $charge = Charge::factory()->create(['workspace_id' => $this->workspace->id, 'customer_id' => $customer->id, 'amount' => 1000]);
        Receipt::factory()->create(['workspace_id' => $this->workspace->id, 'charge_id' => $charge->id, 'amount_received' => 1000, 'received_at' => now()]);

        $insights = $this->service->getCustomerInsights($this->workspace->id);

        $this->assertEquals($customer->name, $insights[0]['name']);
        $this->assertEquals(1000, $insights[0]['ltv']);
    }
}
