<?php

namespace Tests\Feature\Security;

use App\Models\Workspace;
use App\Models\Service;
use App\Models\Professional;
use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicFlowSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspaceA;
    protected Workspace $workspaceB;
    protected Service $serviceA;
    protected Service $serviceB;
    protected Professional $professionalA;
    protected Professional $professionalB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspaceA = Workspace::create(['name' => 'Workspace A', 'slug' => 'workspace-a']);
        $this->workspaceB = Workspace::create(['name' => 'Workspace B', 'slug' => 'workspace-b']);

        $this->serviceA = Service::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Service A',
            'is_active' => true
        ]);
        $this->serviceB = Service::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Service B',
            'is_active' => true
        ]);

        $this->professionalA = Professional::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Professional A',
            'is_active' => true
        ]);
        $this->professionalB = Professional::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Professional B',
            'is_active' => true
        ]);

        // Link professionals to services
        $this->serviceA->professionals()->attach($this->professionalA);
        $this->serviceB->professionals()->attach($this->professionalB);
    }

    /** @test */
    public function it_only_shows_services_for_the_requested_workspace()
    {
        $response = $this->getJson(route('portal.scheduling.services', $this->workspaceA->slug));

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['name' => 'Service A']);
        $response->assertJsonMissing(['name' => 'Service B']);
    }

    /** @test */
    public function it_prevents_accessing_professionals_of_a_service_from_another_workspace()
    {
        // Try to get professionals for Service B using Workspace A's slug
        $response = $this->getJson(route('portal.scheduling.professionals', [
            'workspace' => $this->workspaceA->slug,
            'service' => $this->serviceB->id
        ]));

        $response->assertStatus(404);
    }

    /** @test */
    public function it_prevents_getting_availability_for_a_professional_from_another_workspace()
    {
        $response = $this->getJson(route('portal.scheduling.availability', [
            'workspace' => $this->workspaceA->slug,
            'professional_id' => $this->professionalB->id,
            'service_id' => $this->serviceA->id,
            'date' => now()->addDay()->format('Y-m-d')
        ]));

        $response->assertStatus(404);
    }

    /** @test */
    public function it_prevents_booking_with_service_id_from_another_workspace()
    {
        $response = $this->postJson(route('portal.scheduling.book', $this->workspaceA->slug), [
            'service_id' => $this->serviceB->id,
            'professional_id' => $this->professionalA->id,
            'start_time' => now()->addDay()->format('Y-m-d 10:00'),
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '11999999999',
        ]);

        $response->assertStatus(404);
        $this->assertEquals(0, Appointment::count());
    }

    /** @test */
    public function it_prevents_booking_with_professional_id_from_another_workspace()
    {
        $response = $this->postJson(route('portal.scheduling.book', $this->workspaceA->slug), [
            'service_id' => $this->serviceA->id,
            'professional_id' => $this->professionalB->id,
            'start_time' => now()->addDay()->format('Y-m-d 10:00'),
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '11999999999',
        ]);

        $response->assertStatus(404);
        $this->assertEquals(0, Appointment::count());
    }
}
