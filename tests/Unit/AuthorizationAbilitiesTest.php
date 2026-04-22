<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class AuthorizationAbilitiesTest extends TestCase
{
    /** @test */
    public function sprint_four_critical_abilities_match_the_approved_role_policy(): void
    {
        $admin = new User(['role' => 'admin']);
        $manager = new User(['role' => 'manager']);
        $operator = new User(['role' => 'operator']);

        $this->assertTrue(Gate::forUser($admin)->allows('manage-integrations'));
        $this->assertFalse(Gate::forUser($manager)->allows('manage-integrations'));
        $this->assertFalse(Gate::forUser($operator)->allows('manage-integrations'));

        $this->assertTrue(Gate::forUser($admin)->allows('generate-payment-link'));
        $this->assertTrue(Gate::forUser($manager)->allows('generate-payment-link'));
        $this->assertFalse(Gate::forUser($operator)->allows('generate-payment-link'));

        $this->assertTrue(Gate::forUser($admin)->allows('receive-payment'));
        $this->assertTrue(Gate::forUser($manager)->allows('receive-payment'));
        $this->assertTrue(Gate::forUser($operator)->allows('receive-payment'));

        $this->assertTrue(Gate::forUser($admin)->allows('manage-billing'));
        $this->assertFalse(Gate::forUser($manager)->allows('manage-billing'));
        $this->assertFalse(Gate::forUser($operator)->allows('manage-billing'));

        $this->assertTrue(Gate::forUser($admin)->allows('manage-wallet-credit'));
        $this->assertTrue(Gate::forUser($manager)->allows('manage-wallet-credit'));
        $this->assertFalse(Gate::forUser($operator)->allows('manage-wallet-credit'));

        $this->assertTrue(Gate::forUser($admin)->allows('transition-appointment-critical'));
        $this->assertTrue(Gate::forUser($manager)->allows('transition-appointment-critical'));
        $this->assertFalse(Gate::forUser($operator)->allows('transition-appointment-critical'));
    }
}
