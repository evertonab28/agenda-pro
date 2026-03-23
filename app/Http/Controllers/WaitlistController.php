<?php

namespace App\Http\Controllers;

use App\Models\WaitlistEntry;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Professional;
use App\Enums\WaitlistStatus;
use App\Enums\PreferredPeriod;
use App\Services\AgendaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WaitlistController extends Controller
{
    public function index()
    {
        return Inertia::render('Waitlist/Index', [
            'entries' => WaitlistEntry::with(['customer', 'service', 'professional'])
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'asc')
                ->get(),
            'customers' => Customer::all(['id', 'name']),
            'services' => Service::where('is_active', true)->get(['id', 'name']),
            'professionals' => Professional::where('is_active', true)->get(['id', 'name']),
            'periods' => collect(PreferredPeriod::cases())->map(fn($p) => ['value' => $p->value, 'label' => $p->label()]),
            'statuses' => collect(WaitlistStatus::cases())->map(fn($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'service_id' => 'required|exists:services,id',
            'professional_id' => 'nullable|exists:professionals,id',
            'preferred_period' => 'required|string',
            'notes' => 'nullable|string',
            'priority' => 'integer|min:0',
        ]);

        WaitlistEntry::create($data);

        return redirect()->back()->with('success', 'Entrada adicionada à lista de espera.');
    }

    public function update(Request $request, WaitlistEntry $entry)
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'service_id' => 'required|exists:services,id',
            'professional_id' => 'nullable|exists:professionals,id',
            'preferred_period' => 'required|string',
            'notes' => 'nullable|string',
            'priority' => 'integer|min:0',
            'status' => 'required|string',
        ]);

        $entry->update($data);

        return redirect()->back()->with('success', 'Entrada atualizada.');
    }

    public function destroy(WaitlistEntry $entry)
    {
        $entry->delete();
        return redirect()->back()->with('success', 'Entrada removida.');
    }

    public function convert(Request $request, WaitlistEntry $entry, AgendaService $agendaService)
    {
        $data = $request->validate([
            'starts_at' => 'required|date',
            'professional_id' => 'required|exists:professionals,id',
        ]);

        $endsAt = $agendaService->calculateEndDate($entry->service_id, $data['starts_at']);
        
        $availability = $agendaService->isAvailable(
            $data['professional_id'], 
            $data['starts_at'], 
            $endsAt->toDateTimeString(),
            null,
            $entry->service_id
        );

        if (!$availability['available']) {
            return back()->withErrors(['starts_at' => $availability['message']]);
        }

        $appointment = \App\Models\Appointment::create([
            'customer_id' => $entry->customer_id,
            'service_id' => $entry->service_id,
            'professional_id' => $data['professional_id'],
            'starts_at' => $data['starts_at'],
            'ends_at' => $endsAt,
            'status' => \App\Enums\AppointmentStatus::Scheduled->value,
            'notes' => ($entry->notes ? $entry->notes . "\n" : "") . "[Convertido da Lista de Espera]",
        ]);

        $entry->update(['status' => WaitlistStatus::Converted]);

        return redirect()->route('agenda')->with('success', 'Agendamento criado via Lista de Espera!');
    }
}
