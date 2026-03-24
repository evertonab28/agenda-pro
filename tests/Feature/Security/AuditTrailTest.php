<?php

namespace Tests\Feature\Security;

use App\Models\User;
use App\Models\Charge;
use App\Models\Clinic;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditTrailTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_records_audit_log_when_charge_is_updated()
    {
        $clinic = Clinic::factory()->create();
        $admin = User::factory()->create(['clinic_id' => $clinic->id]);
        $charge = Charge::factory()->create(['clinic_id' => $clinic->id, 'status' => 'pending']);

        $this->actingAs($admin);

        $charge->update(['status' => 'paid']);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'charge.updated',
            'entity' => 'Charge',
            'entity_id' => $charge->id,
        ]);

        $log = AuditLog::latest()->first();
        $this->assertEquals('pending', $log->payload['old']['status']);
        $this->assertEquals('paid', $log->payload['new']['status']);
    }

    /** @test */
    public function it_captures_client_ip_in_audit_log()
    {
        $clinic = Clinic::factory()->create();
        $admin = User::factory()->create(['clinic_id' => $clinic->id]);
        $charge = Charge::factory()->create(['clinic_id' => $clinic->id]);

        $this->actingAs($admin);

        $charge->update(['amount' => 500]);

        $log = AuditLog::latest()->first();
        $this->assertNotNull($log->ip);
    }
}
