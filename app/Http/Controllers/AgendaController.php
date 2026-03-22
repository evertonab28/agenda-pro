<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgendaStoreRequest;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use App\Services\AgendaService;
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
        $filters = $request->only(['from', 'to', 'professional_id', 'service_id', 'status']);
        
        // Default range to current week if not provided
        if (empty($filters['from']) || empty($filters['to'])) {
            $filters['from'] = now()->startOfWeek()->toDateString();
            $filters['to'] = now()->endOfWeek()->toDateString();
        }

        return Inertia::render('Agenda/Index', [
            'events' => $this->agendaService->getAgendaEvents($filters),
            'professionals' => User::where('role', 'professional')->orWhere('role', 'admin')->get(['id', 'name']),
            'services' => Service::where('active', true)->get(['id', 'name', 'duration_minutes', 'price']),
            'customers' => Customer::all(['id', 'name', 'phone']),
            'filters' => $filters,
        ]);
    }

    public function store(AgendaStoreRequest $request)
    {
        $data = $request->validated();

        if ($this->agendaService->hasConflict($data['professional_id'], $data['starts_at'], $data['ends_at'])) {
            return back()->withErrors(['starts_at' => 'O profissional já possui um agendamento neste horário.']);
        }

        Appointment::create($data);

        return redirect()->route('agenda')->with('success', 'Agendamento criado com sucesso.');
    }

    public function update(AgendaStoreRequest $request, Appointment $appointment)
    {
        $data = $request->validated();

        if ($this->agendaService->hasConflict($data['professional_id'], $data['starts_at'], $data['ends_at'], $appointment->id)) {
            return back()->withErrors(['starts_at' => 'O profissional já possui um agendamento neste horário.']);
        }

        $appointment->update($data);

        return redirect()->route('agenda')->with('success', 'Agendamento atualizado com sucesso.');
    }

    public function status(Request $request, Appointment $appointment)
    {
        $request->validate([
            'status' => 'required|string|in:scheduled,confirmed,completed,no_show,canceled',
        ]);

        $appointment->update(['status' => $request->status]);

        return redirect()->route('agenda')->with('success', 'Status atualizado.');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return redirect()->route('agenda')->with('success', 'Agendamento excluído.');
    }
}
