<?php

namespace Tests\Feature\SaaS;

use App\Events\SaaS\InvoicePaid;
use App\Events\SaaS\InvoiceOverdue;
use App\Events\SaaS\InvoiceGenerated;
use App\Models\Workspace;
use App\Models\WorkspaceBillingInvoice;
use App\Services\Billing\WorkspaceBillingService;
use App\Services\Messaging\MessagingServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class EventFormalizationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;
    protected \App\Models\Plan $plan;
    protected WorkspaceBillingInvoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();
        $this->workspace = Workspace::factory()->create();
        $this->plan = \App\Models\Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'price' => 100,
            'billing_cycle' => 'monthly',
            'is_active' => true,
            'features' => []
        ]);
        
        $this->invoice = WorkspaceBillingInvoice::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'amount' => 100,
            'status' => 'pending',
            'due_date' => now()->addDays(3),
            'reference_period' => now()->format('m/Y'),
        ]);
    }

    public function test_confirm_payment_dispatches_invoice_paid_event()
    {
        Event::fake([InvoicePaid::class]);

        $service = app(WorkspaceBillingService::class);
        $service->confirmPayment($this->invoice);

        // We assertDispatched because DB::afterCommit might be swallowed by RefreshDatabase in some Laravel versions
        Event::assertDispatched(InvoicePaid::class);
    }

    public function test_handle_overdue_dispatches_event()
    {
        Event::fake([InvoiceOverdue::class]);

        $service = app(WorkspaceBillingService::class);
        $service->handleOverdue($this->invoice);

        Event::assertDispatched(InvoiceOverdue::class);
        $this->assertEquals('overdue', $this->invoice->fresh()->status);
    }

    public function test_log_commercial_event_listener_records_to_db()
    {
        $subscription = \App\Models\WorkspaceSubscription::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
        ]);

        // We test the listener directly to avoid DB::afterCommit issues in the service test
        $event = new InvoicePaid(
            workspaceId: $this->workspace->id,
            subscriptionId: $subscription->id,
            invoiceId: $this->invoice->id,
            amount: 100.0
        );

        $listener = new \App\Listeners\SaaS\LogCommercialEvent();
        $listener->handle($event);

        $this->assertDatabaseHas('workspace_subscription_events', [
            'workspace_id' => $this->workspace->id,
            'subscription_id' => $subscription->id,
            'event_type' => 'invoice_paid'
        ]);
    }

    public function test_notifications_are_sent_via_listeners()
    {
        $mock = $this->mock(MessagingServiceInterface::class);
        $mock->shouldReceive('send')
            ->once()
            ->withArgs(function($to, $message) {
                return str_contains($message, 'Obrigado! Recebemos o pagamento');
            })
            ->andReturn([]);

        $event = new InvoicePaid(
            workspaceId: $this->workspace->id,
            invoiceId: $this->invoice->id,
            amount: 100.0
        );

        $listener = new \App\Listeners\SaaS\SendCommercialNotification($mock);
        $listener->handle($event);
    }
}
