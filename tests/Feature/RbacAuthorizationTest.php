<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\User;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Validates backend RBAC enforcement for all critical modules.
 * These tests ensure authorize() is actually blocking access — not just hiding buttons.
 */
class RbacAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────
    // AGENDA
    // ──────────────────────────────────────────

    public function test_operator_can_view_agenda()
    {
        $user = User::factory()->create(['role' => 'operator']);
        $this->actingAs($user)->get('/agenda')->assertStatus(200);
    }

    public function test_operator_can_create_appointment()
    {
        $user     = User::factory()->create(['role' => 'operator']);
        $customer = Customer::factory()->create();
        $prof     = Professional::factory()->create(['is_active' => true]);
        $service  = Service::factory()->create(['is_active' => true]);

        $payload = [
            'customer_id'     => $customer->id,
            'professional_id' => $prof->id,
            'service_id'      => $service->id,
            'starts_at'       => now()->addDay()->setHour(10)->setMinute(0)->toDateTimeString(),
            'ends_at'         => now()->addDay()->setHour(10)->setMinute(30)->toDateTimeString(),
            'status'          => 'scheduled',
            'notes'           => null,
        ];

        $this->actingAs($user)->post('/agenda', $payload)->assertRedirect();
    }

    public function test_operator_cannot_delete_appointment()
    {
        $user        = User::factory()->create(['role' => 'operator']);
        $appointment = Appointment::factory()->create(['status' => 'scheduled']);

        $this->actingAs($user)
            ->delete("/agenda/{$appointment->id}")
            ->assertStatus(403);
    }

    public function test_manager_can_delete_appointment()
    {
        $user        = User::factory()->create(['role' => 'manager']);
        $appointment = Appointment::factory()->create(['status' => 'scheduled']);

        $this->actingAs($user)
            ->delete("/agenda/{$appointment->id}")
            ->assertRedirect();
    }

    public function test_unauthenticated_cannot_access_agenda()
    {
        $this->get('/agenda')->assertRedirect('/login');
    }

    // ──────────────────────────────────────────
    // FINANCEIRO — COBRANÇAS
    // ──────────────────────────────────────────

    public function test_operator_cannot_view_charges_index()
    {
        $user = User::factory()->create(['role' => 'operator']);

        $this->actingAs($user)
            ->get('/financeiro/cobrancas')
            ->assertStatus(403);
    }

    public function test_manager_can_view_charges_index()
    {
        $user = User::factory()->create(['role' => 'manager']);
        $this->actingAs($user)->get('/financeiro/cobrancas')->assertStatus(200);
    }

    public function test_operator_cannot_create_charge()
    {
        $user     = User::factory()->create(['role' => 'operator']);
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post('/financeiro/cobrancas', [
            'description' => 'Test',
            'customer_id' => $customer->id,
            'amount'      => 100,
            'due_date'    => now()->addDays(10)->toDateString(),
        ])->assertStatus(403);
    }

    public function test_manager_can_create_charge()
    {
        $user     = User::factory()->create(['role' => 'manager']);
        $customer = Customer::factory()->create();

        $this->actingAs($user)->post('/financeiro/cobrancas', [
            'description' => 'Test',
            'customer_id' => $customer->id,
            'amount'      => 100,
            'due_date'    => now()->addDays(10)->toDateString(),
        ])->assertRedirect();
    }

    public function test_operator_cannot_cancel_charge()
    {
        $user   = User::factory()->create(['role' => 'operator']);
        $charge = Charge::factory()->create(['status' => 'pending']);

        $this->actingAs($user)
            ->delete("/financeiro/cobrancas/{$charge->id}")
            ->assertStatus(403);
    }

    // ──────────────────────────────────────────
    // FINANCEIRO — DASHBOARD
    // ──────────────────────────────────────────

    public function test_operator_cannot_access_finance_dashboard()
    {
        $user = User::factory()->create(['role' => 'operator']);

        $this->actingAs($user)
            ->get('/financeiro/dashboard')
            ->assertStatus(403);
    }

    public function test_admin_can_access_finance_dashboard()
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user)->get('/financeiro/dashboard')->assertStatus(200);
    }

    // ──────────────────────────────────────────
    // CONFIGURAÇÕES
    // ──────────────────────────────────────────

    public function test_operator_cannot_access_services_config()
    {
        $user = User::factory()->create(['role' => 'operator']);

        $this->actingAs($user)
            ->get('/configuracoes/servicos')
            ->assertStatus(403);
    }

    public function test_manager_can_access_services_config()
    {
        $user = User::factory()->create(['role' => 'manager']);
        $this->actingAs($user)->get('/configuracoes/servicos')->assertStatus(200);
    }

    public function test_operator_cannot_modify_professionals()
    {
        $user = User::factory()->create(['role' => 'operator']);

        $this->actingAs($user)
            ->post('/configuracoes/profissionais', [
                'name'      => 'Test',
                'is_active' => true,
            ])
            ->assertStatus(403);
    }
}
