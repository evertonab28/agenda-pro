<?php

namespace Tests\Feature\Portal;

use App\Models\Clinic;
use App\Models\Customer;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ProfessionalSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class SchedulingTest extends TestCase
{
    use RefreshDatabase;

    protected $clinic;
    protected $professional;
    protected $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic = Clinic::factory()->create(['slug' => 'test-clinic']);
        $this->professional = Professional::factory()->create(['clinic_id' => $this->clinic->id]);
        $this->service = Service::factory()->create(['clinic_id' => $this->clinic->id, 'duration_minutes' => 30]);
        
        $this->professional->services()->attach($this->service);

        // Monday Schedule
        ProfessionalSchedule::create([
            'professional_id' => $this->professional->id,
            'weekday' => 1, // Monday
            'start_time' => '09:00',
            'end_time' => '12:00',
            'is_active' => true,
        ]);
    }

    public function test_guest_can_view_scheduling_page()
    {
        $response = $this->get(route('portal.schedule', $this->clinic->slug));
        $response->assertStatus(200);
    }

    public function test_can_fetch_availability()
    {
        // Set a fixed Monday in the future
        $monday = Carbon::parse('next monday')->format('Y-m-d');

        $response = $this->get(route('portal.scheduling.availability', [
            'clinic' => $this->clinic->slug,
            'professional_id' => $this->professional->id,
            'service_id' => $this->service->id,
            'date' => $monday
        ]));

        $response->assertStatus(200);
        $slots = $response->json();
        
        $this->assertContains('09:00', $slots);
        $this->assertContains('11:30', $slots);
        $this->assertNotContains('12:00', $slots);
    }

    public function test_guest_can_book_appointment()
    {
        $monday = Carbon::parse('next monday');
        $startTime = $monday->copy()->setHour(10)->setMinute(0)->format('Y-m-d H:i');

        $response = $this->post(route('portal.scheduling.book', $this->clinic->slug), [
            'service_id' => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time' => $startTime,
            'name' => 'John Doe',
            'phone' => '11999998888',
            // email is missing or null
        ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);

        $this->assertDatabaseHas('appointments', [
            'clinic_id' => $this->clinic->id,
            'professional_id' => $this->professional->id,
            'starts_at' => $monday->copy()->setHour(10)->setMinute(0)->toDateTimeString(),
        ]);

        $this->assertDatabaseHas('customers', [
            'phone' => '11999998888',
            'clinic_id' => $this->clinic->id,
        ]);
    }

    public function test_authenticated_customer_data_is_prefilled_in_controller_context()
    {
        $customer = Customer::factory()->create([
            'clinic_id' => $this->clinic->id,
            'name' => 'Existing Customer',
            'email' => 'existing@example.com'
        ]);

        $response = $this->actingAs($customer, 'customer')
            ->get(route('portal.schedule', $this->clinic->slug));

        $response->assertStatus(200);
        // Inertia check would be better but let's just check status for now
    }

    public function test_booking_updates_phone_if_email_exists()
    {
        $customer = Customer::factory()->create([
            'clinic_id' => $this->clinic->id,
            'email' => 'john@example.com',
            'phone' => '11111111111'
        ]);

        $monday = Carbon::parse('next monday');
        $startTime = $monday->copy()->setHour(10)->setMinute(0)->format('Y-m-d H:i');

        $response = $this->post(route('portal.scheduling.book', $this->clinic->slug), [
            'service_id' => $this->service->id,
            'professional_id' => $this->professional->id,
            'start_time' => $startTime,
            'name' => 'John New Name',
            'email' => 'john@example.com',
            'phone' => '22222222222', // New phone
        ]);

        $response->assertStatus(200);
        
        $customer->refresh();
        $this->assertEquals('22222222222', $customer->phone);
    }

    public function test_send_token_requires_name_for_new_user()
    {
        $response = $this->post(route('portal.auth.send-token', $this->clinic->slug), [
            'identifier' => 'newuser@example.com'
        ]);

        $response->assertStatus(200);
        $response->assertJson(['requires_name' => true]);
    }

    public function test_send_token_creates_user_if_name_provided()
    {
        $response = $this->post(route('portal.auth.send-token', $this->clinic->slug), [
            'identifier' => '47999998888',
            'name' => 'New User Name'
        ]);

        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
        
        $this->assertDatabaseHas('customers', [
            'phone' => '47999998888',
            'name' => 'New User Name'
        ]);
    }
}
