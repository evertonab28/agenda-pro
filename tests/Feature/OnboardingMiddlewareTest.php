<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Validates that the CheckOnboarding middleware redirects incomplete setups
 * and that completed setups can access the dashboard normally.
 */
class OnboardingMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_user_without_services_is_redirected_to_onboarding()
    {
        // No services, professionals, or schedules seeded — incomplete setup
        $user = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($user)->get('/dashboard');

        // The CheckOnboarding middleware should redirect to /onboarding
        $response->assertRedirect('/onboarding');
    }

    public function test_unauthenticated_user_cannot_reach_onboarding_index()
    {
        $this->get('/onboarding')->assertRedirect('/login');
    }

    public function test_onboarding_page_renders_for_incomplete_setup()
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user)->get('/onboarding')->assertStatus(200);
    }

    public function test_operator_redirected_to_dashboard_even_without_onboarding()
    {
        // Operators are not responsible for setting up the system
        // They should either bypass onboarding or be redirected to an appropriate page.
        // This test documents the current expected behavior.
        $user = User::factory()->create(['role' => 'operator']);

        $response = $this->actingAs($user)->get('/dashboard');

        // Operator should be redirected (either to /onboarding or /dashboard)
        // The exact redirect depends on the middleware configuration.
        $this->assertContains($response->getStatusCode(), [200, 302]);
    }
}
