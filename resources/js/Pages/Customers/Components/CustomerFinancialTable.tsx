import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, CreditCard, Clock, CheckCircle2, AlertCircle, FileText, MoreHorizontal } from 'lucide-react';
import Pagination from '@/components/Pagination';

interface Props {
  financialHistory: {
    data: any[];
    links: any[];
  };
}

export default function CustomerFinancialTable({ financialHistory }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

  const getStatusBadge = (charge: any) => {
    if (charge.paid_at) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1 px-3 rounded-full">
          <CheckCircle2 className="w-3 h-3 mr-1.5" /> Pago
        </Badge>
      );
    }
    
    const isOverdue = new Date(charge.due_date) < new Date();
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200 py-1 px-3 rounded-full shadow-sm">
          <AlertCircle className="w-3 h-3 mr-1.5" /> Vencido
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-orange-50 text-orange-700 border-orange-200 py-1 px-3 rounded-full shadow-sm">
        <Clock className="w-3 h-3 mr-1.5" /> Pendente
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Histórico Financeiro
          </h3>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{financialHistory.data.length} registros</span>
        </div>
        
        <Table>
          <TableHeader className="bg-zinc-50/30 dark:bg-zinc-800/30">
            <TableRow className="hover:bg-transparent border-b border-zinc-100 dark:border-zinc-800">
              <TableHead className="py-4 pl-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">Vencimento</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição / Serviço</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Valor</TableHead>
              <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
              <TableHead className="py-4 pr-8 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financialHistory.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                  Nenhum registro financeiro encontrado para este cliente.
                </TableCell>
              </TableRow>
            ) : (
              financialHistory.data.map((charge) => (
                <TableRow key={charge.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 border-b border-zinc-50 dark:border-zinc-800 transition-colors">
                  <TableCell className="py-5 pl-8">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {safeFormat(charge.due_date, "dd 'de' MMM, yyyy")}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">ID: #{charge.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                       <FileText className="w-4 h-4 text-primary opacity-40 shrink-0" />
                       <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                         {charge.appointment?.service?.name || 'Cobrança Avulsa'}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(charge.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    {getStatusBadge(charge)}
                  </TableCell>
                  <TableCell className="py-5 pr-8 text-right">
                    {charge.paid_at ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-tighter flex items-center gap-1">
                           <CreditCard className="w-3 h-3" />
                           {charge.payment_method || 'PIX'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {safeFormat(charge.paid_at, "dd/MM/yy 'às' HH:mm")}
                        </span>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="h-8 rounded-lg border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold transition-all hover:scale-105">
                        Dar Baixa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="p-4 flex justify-center">
           <Pagination links={financialHistory.links} />
        </div>
      </div>
    </div>
  );
}
