<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgendaStoreRequest;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use App\Services\AgendaService;
use App\Services\AuditService;
use App\Enums\AppointmentStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgendaController extends Controller
{
    protected $agendaService;

    public function __construct(AgendaService $agendaService)
    {
        $this->agendaService = $agendaService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['from', 'to', 'professional_id', 'service_id', 'status', 'customer_id']);
        
        // Default to a rolling 7-day window starting today.
        // A Sunday–Saturday fixed week would hide Monday appointments booked on Fri/Sat.
        if (empty($filters['from']) || empty($filters['to'])) {
            $filters['from'] = now()->toDateString();
            $filters['to']   = now()->addDays(6)->toDateString();
        }
    

        return Inertia::render('Agenda/Index', [
            'events'        => $this->agendaService->getAgendaEvents($filters),
            'professionals' => \App\Models\Professional::where('is_active', true)->get(['id', 'name']),
            'services'      => Service::where('is_active', true)->get(['id', 'name', 'duration_minutes', 'buffer_minutes', 'price']),
            'customers'     => Customer::all(['id', 'name', 'phone']),
            'filters'       => $filters,
        ]);
    }

    public function store(AgendaStoreRequest $request)
    {
        $this->authorize('create', Appointment::class);

        $data = $request->validated();
        $availability = $this->agendaService->isAvailable(
            $data['professional_id'], 
            $data['starts_at'], 
            $data['ends_at'], 
            null, 
            $data['service_id']
        );

        if (!$availability['available']) {
            return back()->withErrors(['starts_at' => $availability['message']]);
        }

        $data['status'] = AppointmentStatus::Scheduled->value;
        $appointment = Appointment::create($data);
        AuditService::log(auth()->user(), 'appointment.created', $appointment);

        return redirect()->route('agenda')->with('success', 'Agendamento criado com sucesso.');
    }

    public function update(AgendaStoreRequest $request, Appointment $appointment, \App\Services\AppointmentLifecycleService $lifecycleService)
    {
        $this->authorize('update', $appointment);

        $data = $request->validated();
        $availability = $this->agendaService->isAvailable(
            $data['professional_id'], 
            $data['starts_at'], 
            $data['ends_at'], 
            $appointment->id, 
            $data['service_id']
        );

        if (!$availability['available']) {
            return back()->withErrors(['starts_at' => $availability['message']]);
        }

        $requestedStatus = $data['status'] ?? null;
        unset($data['status']);

        $appointment->update($data);

        if ($requestedStatus && $requestedStatus !== $appointment->fresh()->status) {
            try {
                if (in_array($requestedStatus, [
                    AppointmentStatus::Canceled->value,
                    AppointmentStatus::Completed->value,
                    AppointmentStatus::NoShow->value,
                ], true)) {
                    $this->authorize('transition-appointment-critical');
                }

                match ($requestedStatus) {
                    AppointmentStatus::Confirmed->value => $lifecycleService->confirm($appointment, $request->user()),
                    AppointmentStatus::Canceled->value => $lifecycleService->cancel($appointment, null, $request->user()),
                    AppointmentStatus::Completed->value => $lifecycleService->complete($appointment, $request->user()),
                    AppointmentStatus::NoShow->value => $lifecycleService->markNoShow($appointment, $request->user()),
                    default => null,
                };
            } catch (\DomainException $e) {
                return back()->withErrors(['status' => $e->getMessage()]);
            }
        }

        AuditService::log(auth()->user(), 'appointment.updated', $appointment);

        return redirect()->route('agenda')->with('success', 'Agendamento atualizado com sucesso.');
    }

    public function status(Request $request, Appointment $appointment, \App\Services\AppointmentLifecycleService $lifecycleService)
    {
        $this->authorize('update', $appointment);

        $request->validate([
            'status' => 'required|string|in:' . implode(',', AppointmentStatus::values()),
            'cancel_reason' => 'nullable|string|max:255',
        ]);

        if (in_array($request->status, [
            AppointmentStatus::Canceled->value,
            AppointmentStatus::Completed->value,
            AppointmentStatus::NoShow->value,
        ], true)) {
            $this->authorize('transition-appointment-critical');
        }

        try {
            match ($request->status) {
                AppointmentStatus::Confirmed->value => $lifecycleService->confirm($appointment, $request->user()),
                AppointmentStatus::Canceled->value => $lifecycleService->cancel($appointment, $request->cancel_reason, $request->user()),
                AppointmentStatus::Completed->value => $lifecycleService->complete($appointment, $request->user()),
                AppointmentStatus::NoShow->value => $lifecycleService->markNoShow($appointment, $request->user()),
                default => $appointment->update(['status' => $request->status]),
            };
        } catch (\DomainException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return redirect()->route('agenda')->with('success', 'Status atualizado.');
    }

    public function destroy(Appointment $appointment)
    {
        $this->authorize('delete', $appointment);

        AuditService::log(auth()->user(), 'appointment.deleted', $appointment);
        $appointment->delete();

        return redirect()->route('agenda')->with('success', 'Agendamento excluído.');
    }

    public function finalizeAndCheckout(Appointment $appointment, \App\Services\AppointmentLifecycleService $lifecycleService)
    {
        $this->authorize('transition-appointment-critical');
        $this->authorize('update', $appointment);

        $lifecycleService->complete($appointment, auth()->user());

        return redirect()->route('agenda.checkout.show', $appointment->id);
    }
}
