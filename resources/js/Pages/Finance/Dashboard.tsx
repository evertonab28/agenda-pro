import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Plus, TrendingUp, TrendingDown, Clock, AlertCircle,
    CheckCircle2, Calendar, ChevronRight, ArrowUpRight,
    Search, Banknote, Activity, ExternalLink, DollarSign, BarChart2, PieChart
} from 'lucide-react';
import { route } from '@/utils/route';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

interface FinanceMetrics {
    received: number;
    pending: number;
    overdue: number;
    averageTicket: number;
    defaultRate: number;
}

interface DailyReceipt {
    date: string;
    total: number;
}

interface PaymentMethod {
    method: string;
    total: number;
    count: number;
}

interface ChartData {
    dailyReceipts: DailyReceipt[];
    paymentMethods: PaymentMethod[];
}

interface Props {
    metrics: FinanceMetrics;
    chartData: ChartData;
    filters: { period?: string };
}

const METHOD_LABELS: Record<string, string> = {
    cash: 'Dinheiro', credit_card: 'Crédito', debit_card: 'Débito',
    pix: 'PIX', bank_transfer: 'Transferência', check: 'Cheque', other: 'Outro',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function Dashboard({ metrics, chartData, filters }: Props) {
    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.get(route('finance.dashboard'), { period: e.target.value }, { preserveState: true });
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatPercent = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(value / 100);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const dailyData = chartData.dailyReceipts.map(r => ({ ...r, dateLabel: formatDate(r.date) }));
    const methodData = chartData.paymentMethods.map(m => ({
        ...m,
        label: METHOD_LABELS[m.method] ?? m.method,
    }));

    return (
        <AppLayout>
            <Head title="Painel Financeiro" />

            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {/* Header & Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Banknote className="h-6 w-6 text-emerald-600" />
                            Painel Financeiro
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Visão geral do seu fluxo de caixa e inadimplência.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                            <Calendar className="h-4 w-4 text-gray-400 ml-2" />
                            <select
                                className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                                value={filters.period || 'month'}
                                onChange={handlePeriodChange}
                            >
                                <option value="week">Esta Semana</option>
                                <option value="month">Este Mês</option>
                                <option value="year">Este Ano</option>
                            </select>
                        </div>

                        <Link
                            href="/financeiro/cobrancas/create"
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 transition duration-150 shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Cobrança
                        </Link>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0" />
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingDown className="h-5 w-5" /></div>
                            <h3 className="text-sm font-medium text-gray-500">Recebido</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 relative z-10">{formatCurrency(metrics.received)}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0" />
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Activity className="h-5 w-5" /></div>
                            <h3 className="text-sm font-medium text-gray-500">A Receber</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 relative z-10">{formatCurrency(metrics.pending)}</p>
                        <Link href="/financeiro/cobrancas?status=pending" className="mt-2 text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 relative z-10">
                            Ver todas <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden bg-red-50/30">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-100/50 rounded-bl-full -z-0" />
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertCircle className="h-5 w-5" /></div>
                            <h3 className="text-sm font-medium text-red-800">Vencido</h3>
                        </div>
                        <p className="text-2xl font-bold text-red-700 relative z-10">{formatCurrency(metrics.overdue)}</p>
                        <Link href="/financeiro/cobrancas?status=overdue" className="mt-2 text-xs text-red-600 font-medium hover:underline flex items-center gap-1 relative z-10">
                            Ver pendências <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><DollarSign className="h-5 w-5" /></div>
                            <h3 className="text-sm font-medium text-gray-500">Ticket Médio</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.averageTicket)}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Activity className="h-5 w-5" /></div>
                            <h3 className="text-sm font-medium text-gray-500">Inadimplência</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatPercent(metrics.defaultRate)}</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Daily Receipts Bar Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[300px]">
                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <BarChart2 className="h-5 w-5 text-emerald-600" />
                            Evolução de Recebimentos
                        </h3>
                        {dailyData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-56 text-center">
                                <Banknote className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-400">Nenhum recebimento no período.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Recebido']}
                                    />
                                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Payment Methods Pie Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[300px]">
                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <PieChart className="h-5 w-5 text-blue-600" />
                            Métodos de Pagamento
                        </h3>
                        {methodData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-56 text-center">
                                <TrendingDown className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-400">Nenhum recebimento no período.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsPie>
                                    <Pie
                                        data={methodData}
                                        dataKey="total"
                                        nameKey="label"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        label={(props) => {
                                            const name = String(props.label ?? props.name ?? '');
                                            const pct = props.percent ?? 0;
                                            return `${name} (${(pct * 100).toFixed(0)}%)`;
                                        }}
                                    >
                                        {methodData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                                    <Legend />
                                </RechartsPie>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
