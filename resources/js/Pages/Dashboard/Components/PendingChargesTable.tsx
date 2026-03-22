import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FiltersState, PendingChargesData } from './types';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';

const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid': return <Badge className="bg-emerald-500">Pago</Badge>;
    case 'pending': return <Badge className="bg-amber-500">Pendente</Badge>;
    case 'overdue': return <Badge variant="destructive">Vencido</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

interface Props {
  data: PendingChargesData;
  filterState: FiltersState;
  setFilterState: (state: FiltersState) => void;
}

export function PendingChargesTable({ data, filterState, setFilterState }: Props) {
  
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
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Pendências Financeiras</CardTitle>
            <CardDescription>Próximos vencimentos e atrasos</CardDescription>
          </div>
          
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="pl-9 pr-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-1 focus:ring-primary w-48"
                value={filterState.pending_search || ''}
                onChange={e => setFilterState({ ...filterState, pending_search: e.target.value })}
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
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            {filterState.pending_search 
              ? <p>Nenhum resultado para "{filterState.pending_search}"</p> 
              : <p>Nenhuma pendência encontrada no período filtrado.</p>}
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50">
                <TableRow>
                  <TableHead className="pl-6">Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="pl-6 font-medium truncate max-w-[150px]" title={charge.customer_name}>
                      {charge.customer_name}
                    </TableCell>
                    <TableCell>
                      {charge.due_date ? charge.due_date.split('-').reverse().join('/') : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(charge.status)}</TableCell>
                    <TableCell className="text-right pr-6 whitespace-nowrap font-medium text-muted-foreground">{money(charge.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {data.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30">
          <p className="text-xs text-muted-foreground">Página {data.meta.current_page} de {data.meta.last_page} ({data.meta.total} totais)</p>
          <div className="flex gap-2">
            <button 
              disabled={data.meta.current_page === 1}
              onClick={() => handlePageChange(data.meta.current_page - 1)}
              className="px-3 py-1 text-xs font-medium border rounded-md bg-white dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >Anterior</button>
            <button 
              disabled={data.meta.current_page === data.meta.last_page}
              onClick={() => handlePageChange(data.meta.current_page + 1)}
              className="px-3 py-1 text-xs font-medium border rounded-md bg-white dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >Próxima</button>
          </div>
        </div>
      )}
    </Card>
  );
}
