<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\DashboardService;

class DashboardServiceTest extends TestCase
{
    public function test_it_calculates_deltas_correctly()
    {
        $service = new DashboardService();
        
        $current = [
            'appointments_total' => 150,
            'confirmation_rate' => 80.5,
            'no_show_rate' => 5.0,
            'paid_amount' => 5000,
            'pending_amount' => 1000,
            'overdue_amount' => 500,
        ];
        
        $previous = [
            'appointments_total' => 100,
            'confirmation_rate' => 80.0,
            'no_show_rate' => 10.0,
            'paid_amount' => 4000,
            'pending_amount' => 1200,
            'overdue_amount' => 400,
        ];
        
        $deltas = $service->calculateDeltas($current, $previous);
        
        // Assert Absolute Deltas
        $this->assertEquals(50, $deltas['appointments_total']['absolute']);
        $this->assertEquals(0.5, $deltas['confirmation_rate']['absolute']);
        $this->assertEquals(-5.0, $deltas['no_show_rate']['absolute']);
        $this->assertEquals(1000, $deltas['paid_amount']['absolute']);
        $this->assertEquals(-200, $deltas['pending_amount']['absolute']);
        $this->assertEquals(100, $deltas['overdue_amount']['absolute']);
        
        // Assert Percentage Deltas
        $this->assertEquals(50.0, $deltas['appointments_total']['percentage']);
        $this->assertEquals(25.0, $deltas['paid_amount']['percentage']);
    }

    public function test_it_handles_previous_zeros_in_deltas()
    {
        $service = new DashboardService();
        
        $current = ['appointments_total' => 50];
        $previous = ['appointments_total' => 0];
        
        $deltas = $service->calculateDeltas($current, $previous);
        
        $this->assertEquals(50, $deltas['appointments_total']['absolute']);
        $this->assertEquals(100.0, $deltas['appointments_total']['percentage']);
    }

    public function test_csv_generation()
    {
        $service = new DashboardService();
        
        $data = [
            'current' => [
                'cards' => [
                    'appointments_total' => 10,
                    'confirmation_rate' => 100,
                    'no_show_rate' => 0,
                    'paid_amount' => 300,
                    'pending_amount' => 50,
                    'overdue_amount' => 0,
                ],
            ],
            'pending_charges' => [
                ['customer_name' => 'John Doe', 'amount' => 50, 'due_date' => '2025-01-01', 'status' => 'pending']
            ]
        ];

        $csv = $service->generateCsv($data);
        $this->assertStringContainsString('Total Appointments,10', $csv);
        $this->assertStringContainsString('Paid Amount,300', $csv);
        $this->assertStringContainsString('John Doe,50,2025-01-01,pending', $csv);
    }
}
