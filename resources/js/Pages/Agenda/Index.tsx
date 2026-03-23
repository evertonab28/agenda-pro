import React, { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter, MoreHorizontal, Clock } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, startOfDay, endOfDay, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { route } from '@/lib/route';
import CustomerAutocomplete from '@/components/CustomerAutocomplete';

// Using global route from '@/lib/route'

interface Props {
  events: any[];
  professionals: any[];
  services: any[];
  customers: any[];
  filters: any;
}

const statusColors: any = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-gray-100 text-gray-700 border-gray-200',
  no_show: 'bg-red-100 text-red-700 border-red-200',
  canceled: 'bg-orange-100 text-orange-700 border-orange-200',
};

const paymentStatusColors: any = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  partial: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  none: 'bg-gray-100 text-gray-500 border-gray-200 border-dashed',
};

const paymentStatusLabels: any = {
  pending: 'Pendente',
  partial: 'Parcial',
  paid: 'Pago',
  none: 'Sem Cobrança',
};

export default function AgendaIndex({ events, professionals, services, customers, filters }: Props) {
  // - **Agenda Module**: Implemented a complete operational calendar for daily, weekly, and **monthly** appointment management.
  // - **Redesign**: Overhauled the Weekly view to match the **Google Calendar style**, featuring a refined header, red circular highlights for the current day, and a 'dia inteiro' row.
  // - **Monthly View**: Added a 7-column grid for a full month overview with compact event listing.
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(filters.from ? parseISO(filters.from) : new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    // If filters change from server, update the local currentDate state
    if (filters.from) {
      setCurrentDate(parseISO(filters.from));
    }
  }, [filters.from]);

  const { data, setData, post, put, processing, errors, reset } = useForm({
    customer_id: '',
    service_id: '',
    professional_id: filters.professional_id || (professionals.length > 0 ? String(professionals[0].id) : ''),
    starts_at: '',
    ends_at: '',
    notes: '',
    status: 'scheduled',
    cancel_reason: '',
  });

  useEffect(() => {
    if (filters.customer_id) {
      setData('customer_id', String(filters.customer_id));
      setShowModal(true);
    }
  }, [filters.customer_id]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00

  const days = view === 'month'
    ? eachDayOfInterval({ 
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }), 
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }) 
      })
    : view === 'week' 
    ? eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) })
    : [currentDate];

  const navigate = (direction: 'next' | 'prev' | 'today') => {
    let nextDate = new Date();
    if (direction !== 'today') {
      if (view === 'month') {
        nextDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
      } else {
        const amount = view === 'week' ? 7 : 1;
        nextDate = direction === 'next' ? addDays(currentDate, amount) : subDays(currentDate, amount);
      }
    }

    const fromDate = view === 'month' ? startOfMonth(nextDate) : startOfWeek(nextDate, { weekStartsOn: 0 });
    const toDate = view === 'month' ? endOfMonth(nextDate) : endOfWeek(nextDate, { weekStartsOn: 0 });

    router.get(route('agenda'), { 
      ...filters, 
      from: format(fromDate, 'yyyy-MM-dd'),
      to: format(toDate, 'yyyy-MM-dd'),
      customer_id: '', // Clear customer_id on navigation to avoid re-opening modal
    }, { preserveState: false });
  };

  const openNewModal = (date?: Date, hour?: number) => {
    reset();
    if (date && hour !== undefined) {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + 30);
      
      setData({
        ...data,
        professional_id: filters.professional_id || data.professional_id,
        starts_at: format(start, "yyyy-MM-dd'T'HH:mm"),
        ends_at: format(end, "yyyy-MM-dd'T'HH:mm"),
      });
    }
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setData({
      customer_id: String(event.customer.id),
      service_id: String(event.service.id),
      professional_id: String(event.professional.id),
      starts_at: format(parseISO(event.start), "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(parseISO(event.end), "yyyy-MM-dd'T'HH:mm"),
      notes: event.notes || '',
      status: event.status,
      cancel_reason: event.cancel_reason || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvent) {
      put(route('agenda.update', selectedEvent.id), {
        onSuccess: () => setShowModal(false),
      });
    } else {
      post(route('agenda.store'), {
        onSuccess: () => setShowModal(false),
      });
    }
  };

  const deleteAppointment = () => {
    if (confirm('Deseja excluir este agendamento?')) {
      router.delete(route('agenda.destroy', selectedEvent.id), {
        onSuccess: () => setShowModal(false),
      });
    }
  };

  const updateStatus = (newStatus: string) => {
    router.patch(route('agenda.status', selectedEvent.id), { status: newStatus }, {
      onSuccess: () => setShowModal(false),
    });
  };

  return (
    <AppLayout>
      <Head title="Agenda" />
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 capitalize">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md px-1 py-1 bg-white dark:bg-zinc-900 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 font-medium" onClick={() => navigate('today')}>Hoje</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex bg-white dark:bg-zinc-900 border rounded-md p-1 shadow-sm">
              <Button 
                variant={view === 'day' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => {
                   setView('day');
                   router.get(route('agenda'), { ...filters, from: format(currentDate, 'yyyy-MM-dd'), to: format(currentDate, 'yyyy-MM-dd') }, { preserveState: true });
                }}
                className="h-8 px-4"
              >Dia</Button>
              <Button 
                variant={view === 'week' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => {
                   setView('week');
                   const from = startOfWeek(currentDate, { weekStartsOn: 0 });
                   const to = endOfWeek(currentDate, { weekStartsOn: 0 });
                   router.get(route('agenda'), { ...filters, from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') }, { preserveState: true });
                }}
                className="h-8 px-4"
              >Semana</Button>
              <Button 
                variant={view === 'month' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => {
                   setView('month');
                   const from = startOfMonth(currentDate);
                   const to = endOfMonth(currentDate);
                   router.get(route('agenda'), { ...filters, from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') }, { preserveState: true });
                }}
                className="h-8 px-4"
              >Mês</Button>
            </div>

            <Button onClick={() => openNewModal()} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo
            </Button>
          </div>
        </div>

        <Card className="shadow-md border-none rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
          <div className="px-6 py-3 border-b flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
               <Select 
                 value={filters.professional_id || 'all'} 
                 onChange={(e: any) => router.get(route('agenda'), { ...filters, professional_id: e.target.value === 'all' ? '' : e.target.value }, { preserveState: true })}
                 className="w-[240px] h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-md shadow-sm"
               >
                 <SelectItem value="all">Filtrar por Profissional</SelectItem>
                 {professionals.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
               </Select>
            </div>
            <div className="text-sm font-medium text-muted-foreground italic">
              {view === 'week' ? 'Visão Semanal' : view === 'month' ? 'Visão Mensal' : 'Visão Diária'}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto relative">
            {view === 'month' ? (
              <div className="grid grid-cols-7 border-b">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="p-2 text-center text-[10px] font-bold uppercase text-muted-foreground border-r last:border-0 bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-30 backdrop-blur-sm">
                    {d}
                  </div>
                ))}
                {days.map(day => (
                  <div 
                    key={day.toString()} 
                    className={`min-h-[120px] p-2 border-r border-b last:border-r-0 relative hover:bg-gray-50 dark:hover:bg-zinc-900/30 transition-colors ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}`}
                    onClick={() => openNewModal(day, 9)}
                  >
                    <span className={`text-xs font-medium ${isSameDay(day, new Date()) ? 'bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-2 space-y-1">
                      {events.filter(e => isSameDay(parseISO(e.start), day)).slice(0, 4).map(event => (
                        <div 
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                          className={`px-1.5 py-0.5 rounded text-[9px] truncate border cursor-pointer border-l-4 ${statusColors[event.status]}`}
                        >
                          <span className="font-bold mr-1">{format(parseISO(event.start), 'HH:mm')}</span>
                          {event.customer.name}
                        </div>
                      ))}
                      {events.filter(e => isSameDay(parseISO(e.start), day)).length > 4 && (
                        <p className="text-[9px] text-muted-foreground font-medium pl-1">
                          + {events.filter(e => isSameDay(parseISO(e.start), day)).length - 4} mais
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col min-w-[1000px]">
                {/* Header Grid */}
                <div 
                  className="grid border-b text-center sticky top-0 z-30 bg-white dark:bg-zinc-950 shadow-sm"
                  style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}
                >
                  <div className="p-3 border-r flex items-end justify-center pb-2 bg-zinc-50/30 dark:bg-zinc-900/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">GMT-03</span>
                  </div>
                  {days.map(day => (
                    <div key={day.toString()} className="pt-4 pb-2 border-r flex flex-col items-center gap-1 relative group bg-white dark:bg-zinc-950 last:border-r-0">
                      <span className={`text-[11px] font-bold uppercase text-muted-foreground transition-colors group-hover:text-primary ${isSameDay(day, new Date()) ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {format(day, 'EEE', { locale: ptBR })}
                      </span>
                      <span className={`text-2xl font-medium w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                        isSameDay(day, new Date()) 
                          ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' 
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* All-day row Grid */}
                <div 
                  className="grid border-b sticky top-[89px] z-20 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md h-10 shadow-sm"
                  style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}
                >
                  <div className="flex items-center justify-center border-r text-[10px] text-muted-foreground font-bold uppercase">
                    dia inteiro
                  </div>
                  {days.map(day => (
                    <div key={day.toString()} className="border-r last:border-r-0 relative h-full" />
                  ))}
                </div>

                {/* Hourly Grid with Absolute Overlay for Events */}
                <div className="min-w-[1000px] relative bg-white dark:bg-zinc-950 border-l">
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className={`grid border-b last:border-b-0 h-[80px] ${hour === 7 ? 'mt-4' : ''}`}
                      style={{ gridTemplateColumns: `100px repeat(${days.length}, 1fr)` }}
                    >
                      <div className="relative border-r pr-2 flex justify-end group">
                        <span className="text-[11px] text-muted-foreground/50 font-medium absolute -top-2.5 bg-white dark:bg-zinc-950 px-2 py-0.5 border rounded-full shadow-sm z-10">
                          {hour}:00
                        </span>
                      </div>
                      {days.map(day => (
                        <div 
                          key={day.toString()} 
                          className="border-r last:border-r-0 relative hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 cursor-pointer transition-colors"
                          onClick={(e) => {
                            if (e.target === e.currentTarget) openNewModal(day, hour);
                          }}
                        >
                          {/* Half-hour line */}
                          <div className="absolute inset-x-0 top-1/2 border-t border-zinc-50 dark:border-zinc-900 pointer-events-none" />
                          
                          {/* Events within this cell */}
                          {events.filter(e => isSameDay(parseISO(e.start), day) && parseISO(e.start).getHours() === hour).map(event => (
                             <div 
                               key={event.id}
                               onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                               className={`absolute inset-x-1.5 p-2 rounded-lg border text-[11px] font-medium shadow-sm cursor-pointer z-10 hover:shadow-md transition-all overflow-hidden border-l-4 ${
                                 event.status === 'confirmed' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' :
                                 event.status === 'scheduled' ? 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300' :
                                 event.status === 'completed' ? 'bg-zinc-100 border-zinc-400 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300' :
                                 event.status === 'no_show' ? 'bg-red-50 border-red-500 text-red-800 dark:bg-red-950/30 dark:text-red-300' :
                                 'bg-orange-50 border-orange-500 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300'
                               }`}
                               style={{ 
                                 height: `${( (parseISO(event.end).getTime() - parseISO(event.start).getTime()) / (1000 * 60 * 60) ) * 80 - 8}px`,
                                 top: `${(parseISO(event.start).getMinutes() / 60) * 80 + 4}px`
                               }}
                             >
                                <div className="flex items-center justify-between">
                                  <p className="font-bold truncate">{event.customer.name}</p>
                                  <MoreHorizontal className="w-3 h-3 opacity-40 shrink-0" />
                                </div>
                                <p className="opacity-80 truncate text-[10px]">{event.service.name}</p>
                                <div className="hidden sm:flex items-center gap-1 mt-1 font-semibold text-[9px] opacity-70">
                                   <Clock className="w-2.5 h-2.5" />
                                   {format(parseISO(event.start), 'HH:mm')} - {format(parseISO(event.end), 'HH:mm')}
                                 </div>
                                 <div className="mt-1 flex gap-1">
                                    <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${paymentStatusColors[event.charge?.status || 'none']}`}>
                                      {paymentStatusLabels[event.charge?.status || 'none']}
                                    </Badge>
                                 </div>
                             </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* Timeline Indicator */}
                  {isSameDay(currentDate, new Date()) && (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                      style={{ 
                        top: `${((new Date().getHours() + new Date().getMinutes() / 60) - 7) * 80}px` 
                      }}
                    >
                      <div className="w-3 h-3 bg-red-500 rounded-full absolute -left-1.5 -top-1.5 shadow-md shadow-red-500/50" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
      </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{selectedEvent ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer" className="text-right">Cliente</Label>
                <div className="col-span-3">
                  <CustomerAutocomplete 
                    value={data.customer_id}
                    onChange={(id) => setData('customer_id', id)}
                    error={errors.customer_id}
                    placeholder="Busque por nome ou telefone..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">Serviço</Label>
                <div className="col-span-3">
                  <Select 
                    value={data.service_id} 
                    onChange={(e: any) => {
                      const val = e.target.value;
                      setData('service_id', val);
                      const svc = services.find(s => String(s.id) === val);
                      if (svc && data.starts_at) {
                         const start = parseISO(data.starts_at);
                         const end = new Date(start.getTime() + svc.duration_minutes * 60000);
                         setData(d => ({ ...d, service_id: val, ends_at: format(end, "yyyy-MM-dd'T'HH:mm") }));
                      }
                    }}
                    className="w-full h-9 rounded-md border"
                  >
                    <SelectItem value="">Selecione o serviço</SelectItem>
                    {services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.duration_minutes}min)</SelectItem>)}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="professional" className="text-right">Profissional</Label>
                <div className="col-span-3">
                  <Select 
                    value={data.professional_id} 
                    onChange={(e: any) => setData('professional_id', e.target.value)}
                    className="w-full h-9 rounded-md border"
                  >
                    <SelectItem value="">Selecione o profissional</SelectItem>
                    {professionals.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Início</Label>
                <Input 
                  type="datetime-local" 
                  className={`col-span-3 ${errors.starts_at ? 'border-red-500' : ''}`} 
                  value={data.starts_at} 
                  onChange={e => setData('starts_at', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Término</Label>
                <Input 
                  type="datetime-local" 
                  className={`col-span-3 ${errors.ends_at ? 'border-red-500' : ''}`} 
                  value={data.ends_at} 
                  onChange={e => setData('ends_at', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Notas</Label>
                <Textarea 
                  className="col-span-3" 
                  value={data.notes} 
                  onChange={e => setData('notes', e.target.value)}
                />
              </div>
              {selectedEvent && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-3">
                    <Select 
                      value={data.status} 
                      onChange={(e: any) => setData('status', e.target.value)}
                      className="w-full h-9 rounded-md border"
                    >
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="no_show">Falta</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </Select>
                  </div>
                </div>
              )}
              {data.status === 'canceled' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Motivo</Label>
                  <Input 
                    placeholder="Motivo do cancelamento..."
                    className="col-span-3 border-orange-200 focus:ring-orange-500" 
                    value={data.cancel_reason} 
                    onChange={e => setData('cancel_reason', e.target.value)}
                  />
                </div>
              )}
            </div>
            {errors.starts_at && <p className="text-sm text-red-500 text-center mb-2">{errors.starts_at}</p>}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2 mr-auto">
                {selectedEvent && (
                  <Button type="button" variant="destructive" size="sm" onClick={deleteAppointment}>Excluir</Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                
                {selectedEvent && (
                  <Button 
                    type="button" 
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                        const { cancel_reason, ...rescheduleData } = data;
                        reset();
                        setData({ 
                          ...rescheduleData, 
                          status: 'scheduled',
                          notes: (data.notes ? data.notes + '\n' : '') + '[Reagendamento]' 
                        });
                        setSelectedEvent(null);
                    }}
                  >
                    Reagendar
                  </Button>
                )}

                {selectedEvent && selectedEvent.status !== 'completed' && selectedEvent.status !== 'canceled' && (
                  <Button 
                    type="button" 
                    variant="default" // Changed from green to default since we want premium look
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => router.patch(route('agenda.finalize', selectedEvent.id))}
                  >
                    Finalizar e Cobrar
                  </Button>
                )}

                {(selectedEvent?.charge || selectedEvent?.status === 'completed') && selectedEvent?.status !== 'canceled' && (
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => router.get(route('agenda.checkout.show', selectedEvent.id))}
                  >
                    Abrir Checkout
                  </Button>
                )}

                {(!selectedEvent || (selectedEvent.status !== 'completed' && !selectedEvent.charge)) && (
                   <Button type="submit" disabled={processing}>Salvar</Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
