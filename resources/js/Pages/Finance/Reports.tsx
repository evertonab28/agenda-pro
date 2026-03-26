import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { 
    BarChart3, TrendingUp, Download, Users, Briefcase, 
    ArrowUpRight, Calendar, Filter, FileText
} from 'lucide-react';
import { route } from '@/utils/route';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface FinancialTrend {
    month: string;
    planned: number;
    actual: number;
}

interface ServicePerformance {
    name: string;
    count: number;
    revenue: number;
}

interface CustomerInsight {
    id: number;
    name: string;
    appointments_count: number;
    ltv: number;
}

interface Props {
    financialTrend: FinancialTrend[];
    servicePerformance: ServicePerformance[];
    customerInsights: CustomerInsight[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Reports({ financialTrend, servicePerformance, customerInsights }: Props) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleExport = (type: 'charges' | 'receipts') => {
        window.location.href = route('finance.reports.export', { type });
    };

    return (
        <AppLayout>
            <Head title="Relatórios & BI" />

            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            Relatórios & Business Intelligence
                        </h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Analise o desempenho financeiro e operacional da sua clínica em tempo real.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="flex items-center gap-2" onClick={() => handleExport('charges')}>
                            <Download className="h-4 w-4" />
                            Exportar Cobranças
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2" onClick={() => handleExport('receipts')}>
                            <Download className="h-4 w-4" />
                            Exportar Recibos
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Financial Trend - Area Chart */}
                    <Card className="lg:col-span-8 border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                                        Fluxo de Caixa (Previsto vs Realizado)
                                    </CardTitle>
                                    <CardDescription>Comparativo mensal dos últimos 6 meses</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30">Visualização Mensal</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={financialTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `R$${value/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [formatCurrency(Number(value)), '']}
                                        />
                                        <Legend verticalAlign="top" height={36}/>
                                        <Area type="monotone" dataKey="planned" name="Previsto (Cobranças)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPlanned)" />
                                        <Area type="monotone" dataKey="actual" name="Realizado (Recibos)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Popularity - Bar Chart */}
                    <Card className="lg:col-span-4 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-emerald-500" />
                                Top Serviços por Receita
                            </CardTitle>
                            <CardDescription>Ranking de performance operacional</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={servicePerformance} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <Tooltip 
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                                        />
                                        <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20}>
                                            {servicePerformance.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Insights - LTV Table */}
                    <Card className="lg:col-span-12 border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-amber-500" />
                                    Top Clientes (Lifetime Value)
                                </CardTitle>
                                <CardDescription>Clientes com maior faturamento acumulado</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-indigo-600">Ver Todos</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                        <TableHead className="w-[300px]">Cliente</TableHead>
                                        <TableHead>Agendamentos</TableHead>
                                        <TableHead className="text-right">Ticket Médio</TableHead>
                                        <TableHead className="text-right font-bold">LTV Total</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customerInsights.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">Nenhum dado disponível.</TableCell>
                                        </TableRow>
                                    ) : (
                                        customerInsights.map((customer, index) => (
                                            <TableRow key={customer.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                            {index + 1}
                                                        </div>
                                                        {customer.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">{customer.appointments_count} sessões</Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-slate-500">
                                                    {formatCurrency(customer.appointments_count > 0 ? customer.ltv / customer.appointments_count : 0)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(customer.ltv)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors inline" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
