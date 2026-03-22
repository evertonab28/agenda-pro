<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    public function test_dashboard_renders_with_200()
    {
        $response = $this->get('/dashboard');
        $response->assertStatus(200);
    }

    public function test_dashboard_rejects_invalid_filters()
    {
        $response = $this->get('/dashboard?status[]=invalid_status_abc&professional_id=string');
        $response->assertSessionHasErrors(['status.0', 'professional_id']);
    }

    public function test_dashboard_accepts_valid_filters()
    {
        $response = $this->get('/dashboard?status[]=confirmed&status[]=completed&professional_id=1&from=2024-01-01&to=2024-01-31');
        $response->assertStatus(200);
    }

    public function test_dashboard_export_csv_headers()
    {
        $response = $this->get('/dashboard/export');
        
        $response->assertStatus(200);
        $this->assertTrue(str_contains($response->headers->get('Content-Disposition'), 'attachment; filename="dashboard-'));
    }
}
