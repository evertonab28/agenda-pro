import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast, Toaster } from 'sonner';
import { router } from '@inertiajs/react';

interface Appointment {
    id: number;
    starts_at: string;
    status: string;
    service?: { id: number, name: string, duration_minutes: number };
    professional?: { id: number, name: string };
}

interface AppointmentsProps {
    clinic: { name: string, slug: string };
    appointments: Appointment[];
}

// Global declaration for route() if not using ziggy-js directly in imports
declare function route(name: string, params?: any): string;

export default function Appointments({ clinic, appointments }: AppointmentsProps) {
    const [loading, setLoading] = React.useState(false);
    const [rescheduling, setRescheduling] = React.useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
    const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = React.useState(false);
    const [confirmingCancel, setConfirmingCancel] = React.useState<number | null>(null);
    const [confirmingSlot, setConfirmingSlot] = React.useState<string | null>(null);

    const handleCancel = (id: number) => {
        setConfirmingCancel(id);
    };

    const executeCancel = () => {
        if (!confirmingCancel) return;
        setLoading(true);
        (window as any).axios.post(route('portal.appointments.cancel', [clinic.slug, confirmingCancel]))
            .then((res: any) => {
                if (res.data.ok) {
                    toast.success(res.data.message);
                    setConfirmingCancel(null);
                    router.reload();
                }
            })
            .catch(() => toast.error('Erro ao cancelar agendamento'))
            .finally(() => setLoading(false));
    };

    const handleReschedule = (apt: Appointment) => {
        setRescheduling(apt);
        // Reset state for new reschedule attempt
        setAvailableSlots([]);
    };

    React.useEffect(() => {
        if (rescheduling && selectedDate) {
            setFetchingSlots(true);
            (window as any).axios.get(route('portal.scheduling.availability', clinic.slug), {
                params: {
                    service_id: rescheduling.service?.id,
                    professional_id: rescheduling.professional?.id,
                    date: selectedDate
                }
            }).then((res: any) => {
                // The API returns a plain array of strings
                setAvailableSlots(Array.isArray(res.data) ? res.data : (res.data.slots || []));
            }).catch(() => {
                toast.error('Erro ao buscar horários disponíveis');
            }).finally(() => setFetchingSlots(false));
        }
    }, [rescheduling, selectedDate]);

    const confirmReschedule = (slot: string) => {
        setConfirmingSlot(slot);
    };

    const executeReschedule = () => {
        if (!confirmingSlot || !rescheduling) return;
        const fullTime = `${selectedDate} ${confirmingSlot}`;

        setLoading(true);
        (window as any).axios.put(route('portal.appointments.reschedule', [clinic.slug, rescheduling.id]), {
            start_time: fullTime
        }).then((res: any) => {
            if (res.data.ok) {
                toast.success(res.data.message);
                setConfirmingSlot(null);
                setRescheduling(null);
                router.reload();
            }
        }).catch(() => toast.error('Erro ao reagendar'))
          .finally(() => setLoading(false));
    };
    return (
        <div className="min-h-screen bg-slate-50">
            <Head title={`Meus Agendamentos - ${clinic.name}`} />
            
            <header className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center space-x-4">
                    <Link href={route('portal.dashboard', clinic.slug)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-indigo-900">Meus Agendamentos</h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 py-8 space-y-6">
                <Toaster position="top-center" richColors />
                {appointments.length === 0 ? (
                    // ... (keep existing empty state)
                    <div className="text-center py-12 space-y-4">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium text-slate-900">Nenhum agendamento encontrado</h3>
                            <p className="text-slate-500">Você ainda não possui horários marcados.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map((apt) => (
                            <Card key={apt.id} className={`overflow-hidden border-l-4 ${apt.status === 'cancelled' ? 'border-l-slate-300 opacity-60' : 'border-l-indigo-600'}`}>
                                <CardContent className="p-0">
                                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg text-slate-900">{apt.service?.name}</h3>
                                                <div className="flex items-center text-sm text-slate-500 space-x-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{format(new Date(apt.starts_at), "eeee, d 'de' MMMM", { locale: ptBR })}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-slate-500 space-x-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{format(new Date(apt.starts_at), 'HH:mm')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={
                                                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                    'bg-slate-100 text-slate-700 hover:bg-slate-100'
                                                }>
                                                    {apt.status === 'confirmed' ? 'Confirmado' : 
                                                     apt.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        {/* Actions for upcoming appointments */}
                                        {new Date(apt.starts_at) > new Date() && apt.status !== 'cancelled' && (
                                            <div className="flex items-center space-x-2 w-full md:w-auto">
                                                <button 
                                                    disabled={loading}
                                                    onClick={() => handleReschedule(apt)}
                                                    className="flex-1 md:flex-none text-sm font-medium text-indigo-600 hover:text-indigo-800 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                                >
                                                    Reagendar
                                                </button>
                                                <button 
                                                    disabled={loading}
                                                    onClick={() => handleCancel(apt.id)}
                                                    className="flex-1 md:flex-none text-sm font-medium text-red-600 hover:text-red-800 px-4 py-2 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Simple Reschedule "Modal" */}
            {rescheduling && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl">
                        <CardHeader className="border-b pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle>Reagendar: {rescheduling.service?.name}</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setRescheduling(null)}>×</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Selecione uma nova data</Label>
                                <Input 
                                    type="date" 
                                    className="h-11"
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Horários disponíveis</Label>
                                {fetchingSlots ? (
                                    <div className="py-8 text-center text-slate-500 animate-pulse">Buscando horários...</div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => confirmReschedule(slot)}
                                                disabled={loading}
                                                className="py-2 text-sm font-medium border rounded-md hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed">
                                        Nenhum horário disponível para esta data.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button variant="ghost" onClick={() => setRescheduling(null)}>Cancelar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Cancellation Confirmation */}
            {confirmingCancel && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle className="text-red-700">Cancelar Agendamento?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-600">Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.</p>
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    variant="destructive" 
                                    className="flex-1"
                                    onClick={executeCancel}
                                    disabled={loading}
                                >
                                    {loading ? 'Cancelando...' : 'Sim, Cancelar'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setConfirmingCancel(null)}
                                    disabled={loading}
                                >
                                    Voltar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reschedule Confirmation */}
            {confirmingSlot && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle className="text-indigo-900">Confirmar Novo Horário?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-1">
                                <p className="text-sm text-indigo-700 font-medium">Novo horário selecionado:</p>
                                <p className="text-lg font-bold text-indigo-900">
                                    {format(new Date(`${selectedDate} ${confirmingSlot}`), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                    onClick={executeReschedule}
                                    disabled={loading}
                                >
                                    {loading ? 'Confirmando...' : 'Confirmar'}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setConfirmingSlot(null)}
                                    disabled={loading}
                                >
                                    Alterar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
