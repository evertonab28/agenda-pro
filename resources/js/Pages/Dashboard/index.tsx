import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Calendar, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

interface Delta {
  absolute: number;
  percentage: number;
}

interface Cards {
  appointments_total: number;
  appointments_confirmed: number;
  appointments_completed: number;
  appointments_no_show: number;
  confirmation_rate: number;
  no_show_rate: number;
  pending_amount: number;
  paid_amount: number;
  overdue_amount: number;
}

interface Props {
  filters: {
    from?: string;
    to?: string;
    status: string[];
    professional_id?: number | string;
    service_id?: number | string;
  };
  range: { from: string; to: string };
  previous_range: { from: string; to: string };
  current: { cards: Cards };
  previous: { cards: Cards };
  deltas: Record<keyof Cards, Delta>;
  timeseries: { date: string; appointments: number; revenue: number }[];
  pending_charges: {
    id: number;
    customer_name: string;
    amount: number;
    status: string;
    due_date: string | null;
  }[];
}

const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Pago</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500 hover:bg-amber-600">Pendente</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Vencido</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const DeltaIndicator = ({ delta, reverseColors = false }: { delta: Delta, reverseColors?: boolean }) => {
  if (!delta || delta.percentage === 0) {
    return <div className="flex items-center text-xs text-muted-foreground"><Minus className="w-3 h-3 mr-1" /> 0%</div>;
  }
  const isPositive = delta.absolute > 0;
  
  // se reverseColors = true, ex: faltas (aumento é ruim/vermelho, queda é bom/verde)
  const isGood = reverseColors ? !isPositive : isPositive;
  const colorClass = isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3 mr-1" />
      {delta.percentage}%
    </div>
  );
};

export default function DashboardIndex({ filters, range, current, deltas, timeseries, pending_charges }: Props) {
  const c = current.cards;

  const [filterState, setFilterState] = useState({
    from: filters.from || range.from.split(' ')[0],
    to: filters.to || range.to.split(' ')[0],
    status: filters.status || [],
    professional_id: filters.professional_id || '',
    service_id: filters.service_id || '',
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/dashboard', filterState, { preserveState: true });
  };

  const handleStatusToggle = (val: string) => {
    setFilterState(prev => ({
      ...prev,
      status: prev.status.includes(val) 
        ? prev.status.filter(s => s !== val) 
        : [...prev.status, val]
    }));
  };

  // Montar url de exportação usando API nativa
  const searchParams = new URLSearchParams();
  if (filterState.from) searchParams.append('from', filterState.from);
  if (filterState.to) searchParams.append('to', filterState.to);
  if (filterState.professional_id) searchParams.append('professional_id', String(filterState.professional_id));
  if (filterState.service_id) searchParams.append('service_id', String(filterState.service_id));
  filterState.status.forEach(s => searchParams.append('status[]', s));
  const exportUrl = `/dashboard/export?${searchParams.toString()}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          
          <div className="flex gap-2 items-center flex-wrap">
            <form className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border shadow-sm" onSubmit={handleFilter}>
              {/* Range Datas */}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-500 mx-2" />
                <input 
                  type="date" 
                  className="text-sm bg-transparent border-none focus:ring-0 p-1 text-gray-700 dark:text-gray-300 w-32"
                  value={filterState.from}
                  onChange={(e) => setFilterState({ ...filterState, from: e.target.value })}
                />
                <span className="text-gray-400 px-1">até</span>
                <input 
                  type="date" 
                  className="text-sm bg-transparent border-none focus:ring-0 p-1 text-gray-700 dark:text-gray-300 w-32"
                  value={filterState.to}
                  onChange={(e) => setFilterState({ ...filterState, to: e.target.value })}
                />
              </div>
              
              <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>
              
              {/* Extras */}
              <input 
                type="number" 
                placeholder="ID Prof."
                className="text-sm bg-transparent border border-gray-200 dark:border-zinc-700 rounded p-1 w-20 focus:ring-1 focus:ring-primary"
                value={filterState.professional_id}
                onChange={(e) => setFilterState({ ...filterState, professional_id: e.target.value })}
              />

              <input 
                type="number" 
                placeholder="ID Serv."
                className="text-sm bg-transparent border border-gray-200 dark:border-zinc-700 rounded p-1 w-20 focus:ring-1 focus:ring-primary"
                value={filterState.service_id}
                onChange={(e) => setFilterState({ ...filterState, service_id: e.target.value })}
              />

              <button type="submit" className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors ml-auto sm:ml-2">
                Filtrar
              </button>
            </form>

            <a href={exportUrl} target="_blank" className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium px-4 py-2.5 rounded-lg border shadow-sm transition-colors text-zinc-700 dark:text-zinc-200">
              <Download className="w-4 h-4" />
              CSV
            </a>
          </div>
        </div>

        {/* Status Checkboxes */}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground flex items-center font-medium mr-2">Status do Serviço:</span>
          {['confirmed', 'completed', 'no_show', 'pending', 'cancelled'].map(status => (
            <button 
              key={status} 
              onClick={() => handleStatusToggle(status)}
              className={`px-3 py-1 rounded-full border transition-colors capitalize ${filterState.status.includes(status) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-gray-200 dark:border-zinc-700 hover:border-gray-500'}`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Cards */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">{c.appointments_total}</div>
                <DeltaIndicator delta={deltas.appointments_total} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Confirmação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{c.confirmation_rate}%</div>
                <DeltaIndicator delta={deltas.confirmation_rate} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de No-show</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{c.no_show_rate}%</div>
                <DeltaIndicator delta={deltas.no_show_rate} reverseColors={true} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80">Receita Paga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">{money(c.paid_amount)}</div>
                  <p className="text-xs text-primary-foreground/80 mt-1">
                    +{money(c.pending_amount)} previstos
                  </p>
                </div>
                <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                  <DeltaIndicator delta={deltas.paid_amount} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Chart */}
          <Card className="col-span-full xl:col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Série Diária</CardTitle>
              <CardDescription>Agendamentos e Receita (R$) por dia no período atual</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="appointments" name="Agendamentos" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="right" dataKey="revenue" name="Receita (R$)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="col-span-full xl:col-span-3 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Pendências Financeiras</CardTitle>
              <CardDescription>Principais vencimentos e atrasos</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {pending_charges.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                  <p>Nenhuma pendência encontrada.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending_charges.map((charge) => (
                        <TableRow key={charge.id}>
                          <TableCell className="font-medium truncate max-w-[120px]" title={charge.customer_name}>
                            {charge.customer_name}
                          </TableCell>
                          <TableCell>
                            {charge.due_date ? charge.due_date.split('-').reverse().join('/') : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(charge.status)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap font-medium text-muted-foreground">{money(charge.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}