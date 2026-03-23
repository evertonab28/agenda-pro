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
        
        // Default range to current week if not provided (Sunday to Saturday)
        if (empty($filters['from']) || empty($filters['to'])) {
            $filters['from'] = now()->startOfWeek(\Carbon\Carbon::SUNDAY)->toDateString();
            $filters['to'] = now()->endOfWeek(\Carbon\Carbon::SATURDAY)->toDateString();
        }
    

        return Inertia::render('Agenda/Index', [
            'events'        => $this->agendaService->getAgendaEvents($filters),
            'professionals' => \App\Models\Professional::where('is_active', true)->get(['id', 'name']),
            'services'      => Service::where('is_active', true)->get(['id', 'name', 'duration_minutes', 'price']),
            'customers'     => Customer::all(['id', 'name', 'phone']),
            'filters'       => $filters,
        ]);
    }

    public function store(AgendaStoreRequest $request)
    {
        $this->authorize('create', Appointment::class);

        $data = $request->validated();
        $availability = $this->agendaService->isAvailable($data['professional_id'], $data['starts_at'], $data['ends_at']);

        if (!$availability['available']) {
            return back()->withErrors(['starts_at' => $availability['message']]);
        }

        $appointment = Appointment::create($data);
        AuditService::log(auth()->user(), 'appointment.created', $appointment);

        return redirect()->route('agenda')->with('success', 'Agendamento criado com sucesso.');
    }

    public function update(AgendaStoreRequest $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $data = $request->validated();
        $availability = $this->agendaService->isAvailable($data['professional_id'], $data['starts_at'], $data['ends_at'], $appointment->id);

        if (!$availability['available']) {
            return back()->withErrors(['starts_at' => $availability['message']]);
        }

        $appointment->update($data);
        AuditService::log(auth()->user(), 'appointment.updated', $appointment);

        return redirect()->route('agenda')->with('success', 'Agendamento atualizado com sucesso.');
    }

    public function status(Request $request, Appointment $appointment)
    {
        $this->authorize('update', $appointment);

        $request->validate([
            'status' => 'required|string|in:' . implode(',', AppointmentStatus::values()),
        ]);

        $appointment->update(['status' => $request->status]);
        AuditService::log(auth()->user(), 'appointment.status_changed', $appointment, ['status' => $request->status]);

        return redirect()->route('agenda')->with('success', 'Status atualizado.');
    }

    public function destroy(Appointment $appointment)
    {
        $this->authorize('delete', $appointment);

        AuditService::log(auth()->user(), 'appointment.deleted', $appointment);
        $appointment->delete();

        return redirect()->route('agenda')->with('success', 'Agendamento excluído.');
    }
}
