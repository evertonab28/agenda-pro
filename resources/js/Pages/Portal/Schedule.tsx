import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, MapPin } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast, Toaster } from 'sonner';

export default function Schedule({ workspace, customer }: { workspace: any, customer?: any }) {
    const [step, setStep] = useState(1);
    const [services, setServices] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
    });

    const loadAvailability = () => {
        if (!selectedProfessional || !selectedService) return;

        setLoading(true);
        setSelectedSlot(null);
        (window as any).axios.get(`/p/${workspace.slug}/scheduling/availability`, {
            params: {
                professional_id: selectedProfessional.id,
                service_id: selectedService.id,
                date: format(selectedDate, 'yyyy-MM-dd')
            }
        }).then((res: any) => {
            setAvailableSlots(res.data);
        }).catch(() => {
            toast.error('Erro ao carregar horários. Tente novamente.');
        }).finally(() => setLoading(false));
    };

    useEffect(() => {
        if (step === 1) {
            (window as any).axios.get(`/p/${workspace.slug}/scheduling/services`)
                .then((res: any) => setServices(res.data))
                .catch(() => toast.error('Erro ao carregar serviços. Tente novamente.'));
        }
    }, [step, workspace.slug]);

    useEffect(() => {
        if (selectedService && step === 2) {
            setSelectedProfessional(null);
            setSelectedSlot(null);
            setAvailableSlots([]);
            (window as any).axios.get(`/p/${workspace.slug}/scheduling/services/${selectedService.id}/professionals`)
                .then((res: any) => {
                    setProfessionals(res.data);
                    if (res.data.length > 0) setSelectedProfessional(res.data[0]);
                })
                .catch(() => toast.error('Erro ao carregar profissionais. Tente novamente.'));
        }
    }, [selectedService, step, workspace.slug]);

    useEffect(() => {
        if (selectedProfessional && selectedDate && step === 2) {
            loadAvailability();
        }
    }, [selectedProfessional, selectedDate, selectedService, step]);

    const handleBooking = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        (window as any).axios.post(`/p/${workspace.slug}/scheduling/book`, {
            ...formData,
            service_id: selectedService?.id,
            professional_id: selectedProfessional?.id,
            start_time: `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot}`
        }).then((res: any) => {
            if (res.data.ok) {
                setStep(4);
            }
        }).catch((err: any) => {
            if (err.response?.status === 409) {
                toast.error('Esse horário acabou de ficar indisponível. Atualizamos a lista para você escolher outro.');
                loadAvailability();
                return;
            }

            toast.error(err.response?.data?.message || 'Não foi possível concluir o agendamento. Verifique os dados e tente novamente.');
        }).finally(() => setLoading(false));
    };

    const nextDays = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Toaster position="top-center" richColors />
            <Head title={`Agendar Horário - ${workspace.name}`} />

            <header className="bg-white border-b shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold text-indigo-900">{workspace.name}</h1>
                    {step < 4 && (
                        <div className="text-sm text-slate-500 font-medium">
                            Passo {step} de 3
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Qual serviço você precisa?</h2>
                            <p className="text-slate-600">Selecione uma das opções abaixo para começar.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {services.length > 0 ? services.map(s => (
                                <Card
                                    key={s.id}
                                    className={`cursor-pointer transition-all hover:border-indigo-400 hover:shadow-md ${selectedService?.id === s.id ? 'ring-2 ring-indigo-600 border-indigo-600' : ''}`}
                                    onClick={() => {
                                        setSelectedService(s);
                                        setStep(2);
                                    }}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex justify-between items-center">
                                            {s.name}
                                            <span className="text-sm font-normal text-slate-500">{s.duration_minutes} min</span>
                                        </CardTitle>
                                        <CardDescription>{s.description || 'Atendimento profissional.'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-indigo-600">
                                            R$ {parseFloat(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="md:col-span-2 p-8 bg-white rounded-xl border border-dashed text-center text-slate-500">
                                    Nenhum serviço disponível para agendamento no momento.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div>
                            <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
                                &larr; Voltar para serviços
                            </Button>
                            <h2 className="text-2xl font-bold text-slate-900">Escolha o profissional e horário</h2>
                            <p className="text-slate-600">{selectedService?.name}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <section>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">Selecione uma data</label>
                                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {nextDays.map(date => (
                                            <button
                                                key={date.toString()}
                                                onClick={() => setSelectedDate(date)}
                                                className={`flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl border transition-all ${isSameDay(date, selectedDate) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:border-indigo-300'}`}
                                            >
                                                <span className="text-xs uppercase">{format(date, 'EEE', { locale: ptBR })}</span>
                                                <span className="text-lg font-bold">{format(date, 'dd')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">Horários disponíveis</label>
                                    {professionals.length === 0 ? (
                                        <div className="p-8 bg-slate-100 rounded-xl text-center text-slate-500">
                                            Este serviço ainda não possui profissionais disponíveis.
                                        </div>
                                    ) : loading ? (
                                        <div className="flex justify-center p-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`p-2 text-sm font-medium rounded-lg border transition-all ${selectedSlot === slot ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 hover:border-indigo-400'}`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-slate-100 rounded-xl text-center text-slate-500">
                                            Nenhum horário disponível para esta data. Escolha outro dia ou profissional.
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <label className="block text-sm font-semibold text-slate-700 mb-3">Profissional</label>
                                    <div className="space-y-3">
                                        {professionals.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => setSelectedProfessional(p)}
                                                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedProfessional?.id === p.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'bg-white hover:border-indigo-300'}`}
                                            >
                                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <User size={20} className="text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{p.name}</div>
                                                    <div className="text-xs text-slate-500">{p.specialty || 'Especialista'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <Button
                                    className="w-full h-12 text-lg shadow-lg shadow-indigo-200"
                                    disabled={!selectedSlot || professionals.length === 0}
                                    onClick={() => setStep(3)}
                                >
                                    Continuar para dados
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
                        <Button variant="ghost" onClick={() => setStep(2)} className="mb-4">
                            &larr; Alterar horário
                        </Button>
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle>Seus dados</CardTitle>
                                <CardDescription>
                                    {customer
                                        ? `Olá ${customer.name}, confirme seus dados abaixo para o agendamento.`
                                        : 'Preencha para concluir seu agendamento.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBooking} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nome completo</Label>
                                        <Input
                                            id="name"
                                            required
                                            placeholder="Seu nome aqui"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email (opcional)</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="exemplo@email.com"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                            <Input
                                                id="phone"
                                                required
                                                placeholder="(00) 00000-0000"
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 mb-2">Resumo:</h4>
                                        <div className="text-sm space-y-1 text-indigo-800">
                                            <div className="flex justify-between">
                                                <span>{selectedService?.name}</span>
                                                <span className="font-bold">R$ {parseFloat(selectedService?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div>{selectedProfessional?.name}</div>
                                            <div className="flex items-center space-x-1">
                                                <CalendarIcon size={14} />
                                                <span>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                                                <Clock size={14} className="ml-2" />
                                                <span>às {selectedSlot}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={loading}>
                                        {loading ? 'Processando...' : 'Confirmar agendamento'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 4 && (
                    <div className="text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="flex justify-center">
                            <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 size={48} className="text-green-600" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900">Agendamento realizado com sucesso</h2>
                            <p className="text-slate-600 mt-2">Guarde os dados abaixo para referência.</p>
                        </div>
                        <Card className="max-w-md mx-auto">
                            <CardContent className="pt-6">
                                <div className="text-left space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <MapPin className="text-slate-400 mt-1" size={20} />
                                        <div>
                                            <div className="font-bold">{workspace.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <Clock className="text-slate-400 mt-1" size={20} />
                                        <div>
                                            <div className="font-bold">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedSlot}</div>
                                            <div className="text-sm text-slate-500">{selectedService?.name} com {selectedProfessional?.name}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <Button variant="outline" onClick={() => {
                                if (customer) {
                                    window.location.href = `/p/${workspace.slug}/dashboard`;
                                } else {
                                    window.location.href = `/p/${workspace.slug}/login?identifier=${formData.phone || formData.email}`;
                                }
                            }}>
                                Acessar minha área
                            </Button>
                            <Button onClick={() => window.location.reload()}>
                                Fazer novo agendamento
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            <footer className="p-8 text-center text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} AgendaNexo
            </footer>
        </div>
    );
}
