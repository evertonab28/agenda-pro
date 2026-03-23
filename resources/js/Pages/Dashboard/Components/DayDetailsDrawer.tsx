import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { FiltersState } from './types';

interface Props {
  date: string | null;
  filters: FiltersState;
  onClose: () => void;
}

const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed': return <Badge className="bg-blue-500 hover:bg-blue-600">Confirmado</Badge>;
    case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Concluído</Badge>;
    case 'no_show': return <Badge className="bg-red-500 hover:bg-red-600">Falta</Badge>;
    case 'pending': return <Badge className="bg-amber-500 hover:bg-amber-600">Pendente</Badge>;
    case 'canceled': return <Badge variant="destructive">Cancelado</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export function DayDetailsDrawer({ date, filters, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;
    
    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null);

    const searchParams = new URLSearchParams();
    if (filters.professional_id) searchParams.append('professional_id', String(filters.professional_id));
    if (filters.service_id) searchParams.append('service_id', String(filters.service_id));
    filters.status.forEach(s => searchParams.append('status[]', s));

    axios.get(`/dashboard/day/${date}?${searchParams.toString()}`)
      .then(res => {
        if (isMounted) setData(res.data);
      })
      .catch(err => {
        if (isMounted) setError(err.response?.data?.message || 'Erro ao carregar detalhes do dia.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [date, filters]);

  return (
    <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <DialogTitle className="text-xl">Op. Diária: {date ? date.split('-').reverse().join('/') : ''}</DialogTitle>
          <DialogDescription>
            Agendamentos e panorama financeiro para esta data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {loading && (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg"></div>
                <div className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg"></div>
                <div className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg"></div>
              </div>
              <div className="h-40 bg-gray-100 dark:bg-zinc-800 rounded-lg mt-4"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 dark:border-red-900/50 dark:bg-red-900/10">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Pago (+)</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{money(data.financial.paid)}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Pendente (~)</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{money(data.financial.pending)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Atrasado (-)</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">{money(data.financial.overdue)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Linha do Tempo de Agendamentos</h3>
                {data.appointments.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 text-center">Nenhum agendamento neste dia com os filtros globais atuais.</p>
                ) : (
                  <div className="border rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 overflow-hidden">
                    {data.appointments.data.map((app: any) => (
                      <div key={app.id} className="p-3 sm:px-4 flex justify-between items-center bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{app.customer?.name || 'Cliente Desconhecido'}</p>
                          <p className="text-xs text-muted-foreground">{app.starts_at.split(' ')[1].substring(0, 5)} - {app.service?.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {app.charge && (
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{money(app.charge.amount)}</span>
                          )}
                          {getStatusBadge(app.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
