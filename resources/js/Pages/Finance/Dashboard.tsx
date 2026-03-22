import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    Search,
    Banknote,
    Activity,
    ExternalLink,
    DollarSign
} from 'lucide-react';
import { route } from '@/utils/route';

interface FinanceMetrics {
    received: number;
    pending: number;
    overdue: number;
    averageTicket: number;
    defaultRate: number;
}

interface Props {
    metrics: FinanceMetrics;
    filters: { period?: string };
}

export default function Dashboard({ metrics, filters }: Props) {
    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.get(route('finance.dashboard'), { period: e.target.value }, { preserveState: true });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatPercent = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(value / 100);
    };

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
                        <p className="mt-1 text-sm text-gray-500">
                            Visão geral do seu fluxo de caixa e inadimplência.
                        </p>
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
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-emerald-700 focus:bg-emerald-700 active:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition ease-in-out duration-150 shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Cobrança
                        </Link>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                    {/* Recebido */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0"></div>
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500">Recebido</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 relative z-10">{formatCurrency(metrics.received)}</p>
                    </div>

                    {/* Pendente */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-0"></div>
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Activity className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500">A Receber</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 relative z-10">{formatCurrency(metrics.pending)}</p>
                        <Link 
                            href="/financeiro/cobrancas?status=pending"
                            className="mt-2 text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 relative z-10"
                        >
                            Ver todas <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* Vencido */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col relative overflow-hidden bg-red-50/30">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-100/50 rounded-bl-full -z-0"></div>
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-red-800">Vencido</h3>
                        </div>
                        <p className="text-2xl font-bold text-red-700 relative z-10">{formatCurrency(metrics.overdue)}</p>
                        <Link 
                            href="/financeiro/cobrancas?status=overdue"
                            className="mt-2 text-xs text-red-600 font-medium hover:underline flex items-center gap-1 relative z-10"
                        >
                            Ver pendências <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* Ticket Médio */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500">Ticket Médio</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.averageTicket)}</p>
                    </div>

                    {/* Inadimplência */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <Activity className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-500">Inadimplência</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatPercent(metrics.defaultRate)}</p>
                    </div>
                </div>
                
                {/* Placeholder for Charts / Future implementation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[300px] flex items-center justify-center">
                         <div className="text-center">
                             <Banknote className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                             <h3 className="text-lg font-medium text-gray-900">Evolução de Recebimentos</h3>
                             <p className="text-gray-500 text-sm max-w-sm mt-1">Gráfico de barras mostrando os pagamentos realizados ao longo do tempo será exibido aqui.</p>
                         </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[300px] flex items-center justify-center">
                         <div className="text-center">
                             <TrendingDown className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                             <h3 className="text-lg font-medium text-gray-900">Métodos de Pagamento</h3>
                             <p className="text-gray-500 text-sm max-w-sm mt-1">Gráfico de rosca detalhando a distribuição dos métodos utilizados pelos clientes.</p>
                         </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
