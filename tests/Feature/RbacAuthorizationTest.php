<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\User;
use App\Models\Service;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Validates backend RBAC enforcement for all critical modules.
 */
class RbacAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected $workspace;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->fulfillOnboarding($this->workspace->id);
    }

    private function createUser($role)
    {
        return User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => $role
        ]);
    }

    // ──────────────────────────────────────────
    // AGENDA
    // ──────────────────────────────────────────

    public function test_operator_can_view_agenda()
    {
        $user = $this->createUser('operator');
        $this->actingAs($user)->get(route('agenda'))->assertStatus(200);
    }

    public function test_operator_can_create_appointment()
    {
        $user     = $this->createUser('operator');
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);
        $prof     = Professional::factory()->create(['workspace_id' => $this->workspace->id, 'is_active' => true]);
        $service  = Service::factory()->create(['workspace_id' => $this->workspace->id, 'is_active' => true]);

        $payload = [
            'customer_id'     => $customer->id,
            'professional_id' => $prof->id,
            'service_id'      => $service->id,
            'starts_at'       => now()->addDay()->setHour(10)->setMinute(0)->toDateTimeString(),
            'ends_at'         => now()->addDay()->setHour(10)->setMinute(30)->toDateTimeString(),
            'status'          => 'scheduled',
            'notes'           => null,
        ];

        $this->actingAs($user)->post(route('agenda.store'), $payload)->assertRedirect();
    }

    public function test_operator_cannot_delete_appointment()
    {
        $user        = $this->createUser('operator');
        $appointment = Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'scheduled'
        ]);

        $this->actingAs($user)
            ->delete(route('agenda.destroy', $appointment))
            ->assertStatus(403);
    }

    public function test_manager_can_delete_appointment()
    {
        $user        = $this->createUser('manager');
        $appointment = Appointment::factory()->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'scheduled'
        ]);

        $this->actingAs($user)
            ->delete(route('agenda.destroy', $appointment))
            ->assertRedirect();
    }

    // ──────────────────────────────────────────
    // FINANCEIRO — COBRANÇAS
    // ──────────────────────────────────────────

    public function test_operator_can_view_charges_index()
    {
        $user = $this->createUser('operator');
        $this->actingAs($user)->get(route('finance.charges.index'))->assertStatus(200);
    }

    public function test_operator_cannot_create_charge()
    {
        $user     = $this->createUser('operator');
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

        $this->actingAs($user)->post(route('finance.charges.store'), [
            'description' => 'Test',
            'customer_id' => $customer->id,
            'amount'      => 100,
            'due_date'    => now()->addDays(10)->toDateString(),
        ])->assertStatus(403);
    }

    public function test_manager_can_create_charge()
    {
        $user     = $this->createUser('manager');
        $customer = Customer::factory()->create(['workspace_id' => $this->workspace->id]);

        $this->actingAs($user)->post(route('finance.charges.store'), [
            'description' => 'Test',
            'customer_id' => $customer->id,
            'amount'      => 100,
            'due_date'    => now()->addDays(10)->toDateString(),
        ])->assertRedirect();
    }

    // ──────────────────────────────────────────
    // FINANCEIRO — DASHBOARD
    // ──────────────────────────────────────────

    public function test_operator_can_access_finance_dashboard()
    {
        $user = $this->createUser('operator');
        $this->actingAs($user)->get(route('finance.dashboard'))->assertStatus(200);
    }

    public function test_admin_can_access_finance_dashboard()
    {
        $user = $this->createUser('admin');
        $this->actingAs($user)->get(route('finance.dashboard'))->assertStatus(200);
    }

    // ──────────────────────────────────────────
    // CONFIGURAÇÕES
    // ──────────────────────────────────────────

    public function test_operator_CAN_access_services_config_index()
    {
        $user = $this->createUser('operator');
        $this->actingAs($user)->get(route('configuracoes.services.index'))->assertStatus(200);
    }

    public function test_operator_cannot_create_services_config()
    {
        $user = $this->createUser('operator');
        $this->actingAs($user)->post(route('configuracoes.services.store'), [
            'name' => 'Should fail',
            'price' => 100
        ])->assertStatus(403);
    }

    public function test_manager_can_access_services_config()
    {
        $user = $this->createUser('manager');
        $this->actingAs($user)->get(route('configuracoes.services.index'))->assertStatus(200);
    }

    public function test_operator_cannot_modify_professionals()
    {
        $user = $this->createUser('operator');
        $this->actingAs($user)->post(route('configuracoes.professionals.store'), [
            'name'      => 'Test',
            'is_active' => true,
        ])->assertStatus(403);
    }
}
