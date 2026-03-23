import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomerAutocomplete from '@/components/CustomerAutocomplete';
import { 
    Users, Plus, Search, MoreHorizontal, Calendar, 
    Clock, Trash2, Edit2, CheckCircle2, AlertCircle,
    ArrowRightLeft, Star
} from 'lucide-react';
import { route } from '@/utils/route';

interface Props {
    entries: any[];
    customers: any[];
    services: any[];
    professionals: any[];
    periods: any[];
    statuses: any[];
}

export default function WaitlistIndex({ entries, customers, services, professionals, periods, statuses }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        customer_id: '',
        service_id: '',
        professional_id: '',
        preferred_period: 'any',
        notes: '',
        priority: 0,
        status: 'waiting',
    });

    const convertForm = useForm({
        starts_at: format(new Date(), "yyyy-MM-dd'T'09:00"),
        professional_id: '',
    });

    const openModal = (entry?: any) => {
        if (entry) {
            setSelectedEntry(entry);
            setData({
                customer_id: String(entry.customer_id),
                service_id: String(entry.service_id),
                professional_id: entry.professional_id ? String(entry.professional_id) : '',
                preferred_period: entry.preferred_period,
                notes: entry.notes || '',
                priority: entry.priority,
                status: entry.status,
            });
        } else {
            setSelectedEntry(null);
            reset();
        }
        setShowModal(true);
    };

    const openConvertModal = (entry: any) => {
        setSelectedEntry(entry);
        convertForm.setData('professional_id', entry.professional_id ? String(entry.professional_id) : '');
        setShowConvertModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEntry) {
            put(route('waitlist.update', selectedEntry.id), {
                onSuccess: () => setShowModal(false),
            });
        } else {
            post(route('waitlist.store'), {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleConvert = (e: React.FormEvent) => {
        e.preventDefault();
        convertForm.post(route('waitlist.convert', selectedEntry.id), {
            onSuccess: () => setShowConvertModal(false),
        });
    };

    const deleteEntry = (id: number) => {
        if (confirm('Deseja remover esta entrada da lista de espera?')) {
            router.delete(route('waitlist.destroy', id));
        }
    };

    const getStatusBadge = (status: string) => {
        const config: any = {
            waiting: { color: 'bg-amber-100 text-amber-700', label: 'Aguardando' },
            called: { color: 'bg-blue-100 text-blue-700', label: 'Chamado' },
            converted: { color: 'bg-emerald-100 text-emerald-700', label: 'Convertido' },
            canceled: { color: 'bg-zinc-100 text-zinc-500', label: 'Cancelado' },
        };
        const s = config[status] || config.waiting;
        return <Badge className={`${s.color} border-none`}>{s.label}</Badge>;
    };

    return (
        <AppLayout>
            <Head title="Lista de Espera" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lista de Espera</h1>
                        <p className="text-muted-foreground">Gerencie clientes aguardando por horários vagos.</p>
                    </div>
                    <Button onClick={() => openModal()} className="shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" /> Nova Entrada
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {entries.length === 0 ? (
                        <Card className="border-dashed border-2 py-12 text-center">
                            <CardContent>
                                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-medium">Ninguém na lista</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                                    Adicione clientes que querem ser avisados sobre desistências ou horários específicos.
                                </p>
                                <Button variant="outline" onClick={() => openModal()} className="mt-4">
                                     Clique aqui para começar
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <Card key={entry.id} className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all ${entry.status === 'converted' ? 'opacity-60 bg-zinc-50' : 'bg-white'}`}>
                                    <CardContent className="p-0">
                                        <div className="flex items-center p-4 gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-lg truncate">{entry.customer.name}</span>
                                                    {getStatusBadge(entry.status)}
                                                    {entry.priority > 0 && (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                                            <Star className="w-3 h-3 mr-1 fill-amber-600" /> Prioridade {entry.priority}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-primary" /> {entry.service.name}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 capitalize">
                                                        <Clock className="w-3.5 h-3.5" /> 
                                                        {periods.find(p => p.value === entry.preferred_period)?.label || entry.preferred_period}
                                                    </span>
                                                    {entry.professional && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5" /> {entry.professional.name}
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.notes && (
                                                    <p className="mt-2 text-xs italic text-zinc-500 line-clamp-1">"{entry.notes}"</p>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {entry.status === 'waiting' && (
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                                                        onClick={() => openConvertModal(entry)}
                                                    >
                                                        <ArrowRightLeft className="w-4 h-4 mr-2" /> Agendar
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => openModal(entry)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Cadastro/Edição */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{selectedEntry ? 'Editar Entrada' : 'Nova Entrada na Lista'}</DialogTitle>
                        <DialogDescription>Preencha os dados do cliente e preferências de atendimento.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <CustomerAutocomplete 
                                    label="Cliente"
                                    value={data.customer_id}
                                    onChange={(id) => setData('customer_id', id)}
                                    error={errors.customer_id}
                                    placeholder="Busque por nome ou telefone..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Serviço Desejado</Label>
                                <Select value={data.service_id} onChange={e => setData('service_id', e.target.value)}>
                                    <SelectItem value="">Selecione o serviço</SelectItem>
                                    {services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Profissional (Opcional)</Label>
                                <Select value={data.professional_id} onChange={e => setData('professional_id', e.target.value)}>
                                    <SelectItem value="any">Qualquer um</SelectItem>
                                    {professionals.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Período Preferido</Label>
                                <Select value={data.preferred_period} onChange={e => setData('preferred_period', e.target.value)}>
                                    {periods.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Prioridade (0-10)</Label>
                                <Input type="number" value={data.priority} onChange={e => setData('priority', parseInt(e.target.value))} />
                            </div>
                        </div>

                        {selectedEntry && (
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={data.status} onChange={e => setData('status', e.target.value)}>
                                    {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Observações</Label>
                            <Textarea 
                                placeholder="Ex: Avisar somente se for após as 18h..." 
                                value={data.notes} 
                                onChange={e => setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Conversão para Agendamento */}
            <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Converter para Agendamento</DialogTitle>
                        <DialogDescription>Defina o horário e profissional para confirmar o agendamento.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConvert} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Data e Hora de Início</Label>
                            <Input 
                                type="datetime-local" 
                                value={convertForm.data.starts_at} 
                                onChange={e => convertForm.setData('starts_at', e.target.value)}
                            />
                            {convertForm.errors.starts_at && <p className="text-xs text-red-500">{convertForm.errors.starts_at}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Profissional</Label>
                            <Select value={convertForm.data.professional_id} onChange={e => convertForm.setData('professional_id', e.target.value)}>
                                <SelectItem value="">Selecione o profissional</SelectItem>
                                {professionals.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                            </Select>
                            {convertForm.errors.professional_id && <p className="text-xs text-red-500">{convertForm.errors.professional_id}</p>}
                        </div>
                        
                        <div className="bg-zinc-50 p-3 rounded-lg border text-sm">
                            <p className="font-medium flex items-center gap-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-primary" /> Confirmação de Conversão
                            </p>
                            <p className="text-muted-foreground italic">
                                Ao confirmar, um novo agendamento será criado e a lista de espera será baixada automaticamente.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowConvertModal(false)}>Voltar</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={convertForm.processing}>
                                Confirmar Agendamento
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
