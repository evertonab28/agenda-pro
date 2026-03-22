import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

type Props = {
  overview: {
    range: { from: string; to: string };
    cards: {
      appointments_total: number;
      appointments_confirmed: number;
      appointments_completed: number;
      appointments_no_show: number;
      confirmation_rate: number;
      no_show_rate: number;
      pending_amount: number;
      paid_amount: number;
      overdue_amount: number;
    };
  };
  timeseries: { date: string; appointments: number; revenue: number }[];
  pending_charges: {
    id: number;
    customer_name: string;
    amount: number;
    status: string;
    due_date: string | null;
  }[];
};

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

export default function DashboardIndex({ overview, timeseries, pending_charges }: Props) {
  const c = overview.cards;

  const [dateRange, setDateRange] = useState({
    from: overview.range.from.split(' ')[0], // YYYY-MM-DD
    to: overview.range.to.split(' ')[0],
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/dashboard', { from: dateRange.from, to: dateRange.to }, { preserveState: true });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          
          <form className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border shadow-sm" onSubmit={handleFilter}>
            <Calendar className="w-5 h-5 text-gray-500 ml-2" />
            <input 
              type="date" 
              className="text-sm bg-transparent border-none focus:ring-0 p-1 text-gray-700 dark:text-gray-300"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <span className="text-gray-400">até</span>
            <input 
              type="date" 
              className="text-sm bg-transparent border-none focus:ring-0 p-1 text-gray-700 dark:text-gray-300"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white text-sm px-3 py-1.5 rounded-md font-medium transition-colors">
              Filtrar
            </button>
          </form>
        </div>

        {/* Cards */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.appointments_total}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Confirmação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{c.confirmation_rate}%</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de No-show</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{c.no_show_rate}%</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80">Soma Pendente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{money(c.pending_amount + c.overdue_amount)}</div>
              <p className="text-xs text-primary-foreground/70 mt-1">
                {money(c.overdue_amount)} em atraso
              </p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Chart */}
          <Card className="col-span-full xl:col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Série Diária</CardTitle>
              <CardDescription>Agendamentos e Receita (R$) por dia</CardDescription>
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
              <CardDescription>Próximos vencimentos e atrasos</CardDescription>
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