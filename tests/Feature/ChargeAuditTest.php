<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Charge;
use App\Models\Workspace;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChargeAuditTest extends TestCase
{
    use RefreshDatabase;

    protected $workspace;
    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::factory()->create();
        $this->admin = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'admin'
        ]);

        $this->fulfillOnboarding($this->workspace->id);
    }

    public function test_creating_charge_generates_audit_log()
    {
        $this->actingAs($this->admin);

        $this->post(route('finance.charges.store'), [
            'description' => 'Audited Charge',
            'amount' => 200,
            'due_date' => now()->format('Y-m-d'),
            'payment_method' => 'pix'
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'charge.created',
            'entity' => 'Charge'
        ]);
        
        $log = AuditLog::where('action', 'charge.created')->first();
        $this->assertEquals($this->admin->id, $log->user_id);
    }

    public function test_updating_charge_logs_changes()
    {
        $charge = Charge::factory()->create([
            'workspace_id' => $this->workspace->id,
            'description' => 'Old Description',
            'amount' => 100
        ]);

        $this->actingAs($this->admin);

        $this->put(route('finance.charges.update', $charge), [
            'description' => 'New Description',
            'amount' => 150,
            'due_date' => now()->format('Y-m-d')
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'charge.updated',
            'entity' => 'Charge',
            'entity_id' => $charge->id
        ]);

        $log = AuditLog::where('action', 'charge.updated')->first();
        // dd($log->payload); 
        
        $this->assertArrayHasKey('old', $log->payload);
        $this->assertArrayHasKey('new', $log->payload);
        
        $this->assertEquals('Old Description', $log->payload['old']['description']);
        $this->assertEquals('New Description', $log->payload['new']['description']);
    }

    public function test_receiving_payment_generates_receipt_audit_log()
    {
        $charge = Charge::factory()->create(['workspace_id' => $this->workspace->id, 'amount' => 100]);
        
        $this->actingAs($this->admin);

        $this->post(route('finance.charges.receive', $charge), [
            'amount_received' => 100,
            'method' => 'pix',
            'received_at' => now()->toISOString()
        ]);

        // Receipt creation should be logged because Receipt model uses Logged trait too
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'receipt.created',
            'entity' => 'Receipt'
        ]);
    }
}
