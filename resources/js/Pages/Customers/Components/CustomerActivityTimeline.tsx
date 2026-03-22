import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, DollarSign, UserPlus, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';

interface Props {
  appointments: any[];
  financialHistory: any[];
  customer: any;
}

interface TimelineEvent {
  type: string;
  date: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  status?: string;
}

const safeFormat = (dateStr: string, formatStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, formatStr, { locale: ptBR });
  } catch (e) {
    return 'Error';
  }
};

export default function CustomerActivityTimeline({ appointments, financialHistory, customer }: Props) {
  // Combine and sort events
  const events: TimelineEvent[] = [
    {
      type: 'created',
      date: customer.created_at,
      title: 'Cliente Cadastrado',
      description: 'O perfil do cliente foi criado no sistema.',
      icon: UserPlus,
      color: 'bg-primary text-white',
    },
    ...appointments.map(app => ({
      type: 'appointment',
      date: app.starts_at,
      title: `Agendamento: ${app.service?.name || 'Serviço não informado'}`,
      description: `Profissional: ${app.professional?.name || 'Profissional não informado'}`,
      icon: Calendar,
      color: app.status === 'completed' ? 'bg-zinc-500 text-white' : 'bg-blue-500 text-white',
      status: app.status,
    })),
    ...financialHistory.filter(f => f.paid_at).map(f => ({
      type: 'payment',
      date: f.paid_at,
      title: `Pagamento Recebido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.amount)}`,
      description: `Método: ${f.payment_method || 'PIX'}`,
      icon: DollarSign,
      color: 'bg-emerald-500 text-white',
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-8 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Timeline de Atividade
        </h3>
        <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-widest">Recentes</Badge>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-200 before:via-zinc-200 before:to-transparent dark:before:from-zinc-800 dark:before:via-zinc-800">
        {events.slice(0, 10).map((event, idx) => {
          const Icon = event.icon;
          
          return (
            <div key={idx} className="relative flex items-start gap-6 group">
               <div className={`shrink-0 w-10 h-10 rounded-2xl ${event.color} flex items-center justify-center shadow-lg shadow-zinc-200 dark:shadow-none group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                 <Icon className="w-5 h-5" />
               </div>
               
               <div className="flex-1 pt-1">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                   <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{event.title}</h4>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                     {format(parseISO(event.date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                   </span>
                 </div>
                 <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{event.description}</p>
                 
                 {event.status && (
                   <div className="mt-2 flex items-center gap-2">
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1" />
                      <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter italic">{event.status}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-300" />
                   </div>
                 )}
               </div>
            </div>
          );
        })}
      </div>
      
      {events.length > 10 && (
        <Button variant="ghost" className="w-full mt-8 rounded-xl text-muted-foreground font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800">
          Ver Histórico Completo
        </Button>
      )}
    </div>
  );
}
