<?php

namespace Tests\Feature\Security;

use App\Models\Customer;
use App\Models\CustomerAuthToken;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class OtpSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspaceA;
    protected Workspace $workspaceB;
    protected Customer $customerA;
    protected Customer $customerB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspaceA = Workspace::factory()->create(['slug' => 'workspace-a']);
        $this->workspaceB = Workspace::factory()->create(['slug' => 'workspace-b']);

        $this->customerA = Customer::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'phone' => '11999990001',
            'email' => 'customer-a@example.com',
        ]);

        $this->customerB = Customer::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'phone' => '11999990002',
            'email' => 'customer-b@example.com',
        ]);
    }
}
