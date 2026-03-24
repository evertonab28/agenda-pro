<?php

namespace Tests\Feature\Security;

use App\Models\User;
use App\Models\Clinic;
use App\Models\Charge;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_automatically_scopes_queries_by_tenant()
    {
        // 1. Criar Clínica A e Clinica B
        $clinicA = Clinic::create(['name' => 'Clinica A', 'slug' => 'clinic-a']);
        $clinicB = Clinic::create(['name' => 'Clinica B', 'slug' => 'clinic-b']);

        // 2. Criar Admin na Clínica A
        $adminA = User::factory()->create(['clinic_id' => $clinicA->id]);
        
        // 3. Criar Dados em ambas
        Charge::factory()->create(['clinic_id' => $clinicA->id, 'amount' => 100]);
        Charge::factory()->create(['clinic_id' => $clinicB->id, 'amount' => 200]);

        // 4. Agir como Admin A
        $this->actingAs($adminA);

        // 5. Verificar que só vê dados da Clínica A
        $this->assertEquals(1, Charge::count());
        $this->assertEquals(100, Charge::first()->amount);
    }

    /** @test */
    public function it_prevents_unauthorized_access_to_other_tenant_resource()
    {
        $clinicA = Clinic::create(['name' => 'Clinica A', 'slug' => 'clinic-a']);
        $clinicB = Clinic::create(['name' => 'Clinica B', 'slug' => 'clinic-b']);

        $adminA = User::factory()->create(['clinic_id' => $clinicA->id]);
        $chargeB = Charge::factory()->create(['clinic_id' => $clinicB->id]);

        $this->actingAs($adminA);

        // Tenta buscar via API/Policy
        // Nota: O GlobalScope já vai fazer retornar 404 se não achar no scope
        $response = $this->getJson("/api/charges/{$chargeB->id}");
        
        $response->assertStatus(404); // Scoped out
    }
}
