import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, MoreHorizontal } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface Props {
  appointments: {
    data: any[];
    links: any[];
  };
}

const statusMap: any = {
  'scheduled': { label: 'Agendado', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  'confirmed': { label: 'Confirmado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  'completed': { label: 'Concluído', color: 'bg-zinc-100 text-zinc-700 border-zinc-200', icon: CheckCircle2 },
  'no_show': { label: 'Falta', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  'canceled': { label: 'Cancelado', color: 'bg-zinc-100 text-zinc-400 border-zinc-100', icon: XCircle },
};

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

export default function CustomerAppointmentsTable({ appointments }: Props) {
  if (!appointments || !appointments.data) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 p-8 text-center text-muted-foreground">
        Nenhum dado de agendamento disponível.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Histórico de Agendamentos
          </h3>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{appointments.data.length} registros</span>
        </div>
        
        <Table>
          <TableHeader className="bg-zinc-50/30 dark:bg-zinc-800/30">
            <TableRow className="hover:bg-transparent border-b border-zinc-100 dark:border-zinc-800">
              <TableHead className="py-4 pl-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">Data e Hora</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Serviço</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Profissional</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
              <TableHead className="py-4 pr-8 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                  Nenhum agendamento encontrado para este cliente.
                </TableCell>
              </TableRow>
            ) : (
              appointments.data.map((app) => {
                const status = statusMap[app.status] || statusMap['scheduled'];
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={app.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 border-b border-zinc-50 dark:border-zinc-800 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {safeFormat(app.starts_at, "dd 'de' MMMM, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {safeFormat(app.starts_at, "HH:mm")} - {safeFormat(app.ends_at, "HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <span className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-sm font-bold border border-primary/10">
                        {app.service?.name || 'Serviço não informado'}
                      </span>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {app.professional?.name || 'Profissional não informado'}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-center">
                      <Badge className={`${status.color} py-1 px-3 rounded-full border shadow-sm`}>
                        <StatusIcon className="w-3 h-3 mr-1.5" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5 pr-8 text-right">
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        <div className="p-4 flex justify-center">
           <Pagination links={appointments.links} />
        </div>
      </div>
    </div>
  );
}
