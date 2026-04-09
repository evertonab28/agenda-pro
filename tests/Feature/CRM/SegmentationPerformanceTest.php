<?php

namespace Tests\Feature\CRM;

use App\Models\Customer;
use App\Models\Appointment;
use App\Services\CRMService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SegmentationPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_segment_counts_is_performant()
    {
        // Seed some data without observers overwriting our manual segments
        Customer::withoutEvents(function() {
            Customer::factory()->count(50)->create(['current_segment' => 'Novo']);
            Customer::factory()->count(30)->create(['current_segment' => 'Ativo']);
            Customer::factory()->count(10)->create(['current_segment' => 'VIP']);
        });

        $service = new CRMService();

        // Count queries
        DB::enableQueryLog();
        $counts = $service->getSegmentCounts();
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        // dd($counts); // For manual debugging if needed

        // Should be 1 query for the counts
        $this->assertLessThanOrEqual(5, count($queries), "Should not run N+1 queries for segment counts");
        
        $this->assertEquals(50, $counts['Novo']);
        $this->assertEquals(30, $counts['Ativo']);
        $this->assertEquals(10, $counts['VIP']);
    }

    public function test_appointment_completion_triggers_segment_update()
    {
        $workspace = \App\Models\Workspace::factory()->create();
        $customer = Customer::factory()->create([
            'workspace_id' => $workspace->id,
            'current_segment' => 'Novo'
        ]);

        // Create 11 completed appointments to make them VIP (>= 10)
        Appointment::factory()->count(11)->create([
            'workspace_id' => $workspace->id,
            'customer_id' => $customer->id,
            'status' => 'completed',
            'starts_at' => now()->subDays(1)
        ]);

        // Manually trigger the job for the test (or rely on observer)
        // Since we are in a test with sync queue, the observer should have triggered it.
        
        $customer->refresh();
        $this->assertEquals('VIP', $customer->current_segment);
    }
}
