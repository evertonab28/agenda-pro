import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FiltersState, PendingChargesData } from './types';
import { router } from '@inertiajs/react';
import { Search, Wallet } from 'lucide-react';
import { EmptyState } from '@/components/Shared/EmptyState';

const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid': return <Badge className="bg-success text-white font-semibold uppercase tracking-widest text-[10px] rounded-lg">Pago</Badge>;
    case 'pending': return <Badge className="bg-warning text-white font-semibold uppercase tracking-widest text-[10px] rounded-lg">Pendente</Badge>;
    case 'overdue': return <Badge variant="destructive" className="font-semibold uppercase tracking-widest text-[10px] rounded-lg">Vencido</Badge>;
    default: return <Badge variant="outline" className="font-semibold uppercase tracking-widest text-[10px] rounded-lg">{status}</Badge>;
  }
};

interface Props {
  data: PendingChargesData;
  filterState: FiltersState;
  setFilterState: (state: FiltersState) => void;
}

export function PendingChargesTable({ data, filterState, setFilterState }: Props) {
  if (!data || !data.data) return null;
  
  const [searchTerm, setSearchTerm] = useState(filterState.pending_search || '');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== (filterState.pending_search || '')) {
        const newState = { ...filterState, pending_search: searchTerm, pending_page: 1 };
        setFilterState(newState);
        router.get('/dashboard', newState as any, { preserveState: true, preserveScroll: true });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/dashboard', { ...filterState as any, pending_page: 1 }, { preserveState: true, preserveScroll: true });
  };

  const handlePageChange = (page: number) => {
    const newState = { ...filterState, pending_page: page };
    setFilterState(newState);
    router.get('/dashboard', newState as any, { preserveState: true, preserveScroll: true });
  };

  return (
    <Card className="shadow-sm flex flex-col col-span-full xl:col-span-8">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-base font-bold tracking-tight">Pendências Financeiras</CardTitle>
            <CardDescription className="text-sm font-medium opacity-70">Próximos vencimentos e atrasos</CardDescription>
          </div>
          
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-primary opacity-40" />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-border/60 bg-muted/30 focus:ring-1 focus:ring-primary w-52 placeholder:opacity-50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-transparent px-3 py-1.5 focus:ring-1 focus:ring-primary"
              value={filterState.pending_status || 'all'}
              onChange={e => {
                const ns = { ...filterState, pending_status: e.target.value, pending_page: 1 };
                setFilterState(ns);
                router.get('/dashboard', ns as any, { preserveState: true, preserveScroll: true });
              }}
            >
              <option value="all">Status: Todos</option>
              <option value="pending">Pendentes</option>
              <option value="overdue">Vencidos</option>
            </select>
          </form>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {data.data.length === 0 ? (
          <EmptyState 
            icon={Wallet}
            title="Tudo em dia!"
            description={filterState.pending_search 
              ? `Nenhuma pendência encontrada para "${filterState.pending_search}"` 
              : "Nenhuma pendência financeira encontrada no período selecionado."}
          />
        ) : (
          <div>
            <Table>
              <TableHeader className="bg-muted/30 border-b border-border/40">
                <TableRow>
                  <TableHead className="pl-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground py-4">Cliente</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-widest text-muted-foreground py-4">Vencimento</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-widest text-muted-foreground py-4">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground py-4">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((charge) => (
                  <TableRow key={charge.id} className="hover:bg-muted/20 transition-colors border-b border-border/40">
                    <TableCell className="pl-6 py-4">
                        <span className="font-bold text-sm text-foreground truncate max-w-[200px] block" title={charge.customer_name}>
                            {charge.customer_name}
                        </span>
                    </TableCell>
                    <TableCell className="py-4 text-sm font-bold text-muted-foreground">
                      {charge.due_date ? charge.due_date.split('-').reverse().join('/') : '-'}
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(charge.status)}</TableCell>
                    <TableCell className="text-right pr-6 py-4 whitespace-nowrap font-black text-base text-foreground">{money(charge.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border/40 bg-gray-50/30 dark:bg-zinc-900/30">
          <p className="text-xs text-muted-foreground">Página {data.meta.current_page} de {data.meta.last_page} ({data.meta.total} totais)</p>
          <div className="flex gap-2">
            <button 
              disabled={data.meta.current_page === 1}
              onClick={() => handlePageChange(data.meta.current_page - 1)}
              className="px-3 py-1 text-xs font-medium border rounded-md bg-card hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >Anterior</button>
            <button 
              disabled={data.meta.current_page === data.meta.last_page}
              onClick={() => handlePageChange(data.meta.current_page + 1)}
              className="px-3 py-1 text-xs font-medium border rounded-md bg-card hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >Próxima</button>
          </div>
        </div>
      )}
    </Card>
  );
}
