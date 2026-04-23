import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DailyActions } from './Components/DailyActions';
import { TrendingUp, Users, AlertTriangle, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardFilters } from './Components/DashboardFilters';
import { FiltersState } from './Components/types';

interface Props {
    heatmap: any[];
    revenue: {
        forecasted: number;
        realized: number;
        gap: number;
    };
    noShowRanking: any[];
    retention: {
        total: number;
        returning: number;
        rate: number;
    };
    dailyActions: any[];
    filters: FiltersState;
}

export default function ExecutiveDashboard({ heatmap, revenue, noShowRanking, retention, dailyActions, filters }: Props) {
    const [filterState, setFilterState] = React.useState<FiltersState>({
        from: filters.from || '',
        to: filters.to || '',
        status: filters.status || ['confirmed', 'completed', 'no_show', 'pending', 'overdue'],
        professional_id: filters.professional_id || '',
        service_id: filters.service_id || '',
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <AppLayout>
            <Head title="BI Executivo - Performance" />

            <div className="space-y-8 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
                        <p className="text-muted-foreground">Visão estratégica de performance, finanças e retenção.</p>
                    </div>
                    
                    <DashboardFilters 
                        filterState={filterState}
                        setFilterState={setFilterState}
                        baseUrl="/dashboard/executivo"
                        exportUrl="/dashboard/export"
                        canExport={true}
                    />
                </div>

                {/* Top KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border shadow-sm bg-card overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-12 h-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Receita Realizada</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black text-emerald-600">{formatCurrency(revenue.realized)}</p>
                            <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-muted-foreground bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-0.5 rounded-full">
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{Math.round((revenue.realized / (revenue.forecasted || 1)) * 100)}% do projetado</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm bg-card overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="w-12 h-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Taxa de Retenção</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-black text-primary">{retention.rate}%</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-muted-foreground">
                                <Users className="w-3 h-3 text-primary" />
                                {retention.returning} clientes recorrentes
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm bg-card overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <AlertTriangle className="w-12 h-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Perda estimada (No-Show)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-black text-red-600">{formatCurrency(revenue.gap)}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-muted-foreground">
                                <ArrowDownRight className="w-3 h-3 text-red-500" />
                                Impacto financeiro direto
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm bg-card overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="w-12 h-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ocupação Média</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* logic for avg density based on heatmap max */}
                            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                                {Math.round((heatmap.reduce((acc, h) => acc + h.count, 0) / (heatmap.length || 1)) / (Math.max(...heatmap.map(h => h.count), 1)) * 100)}%
                            </p>
                            <div className="flex items-center gap-1 mt-3 text-xs font-bold text-muted-foreground uppercase">
                                Período Selecionado
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12">
                        <DailyActions actions={dailyActions} />
                    </div>

                    {/* Heatmap Section */}
                    <Card className="border shadow-sm bg-card lg:col-span-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Densidade de Atendimentos</CardTitle>
                            <CardDescription>Horários com maior volume nos últimos 30 dias.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {heatmap.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-8">Nenhum dado no período.</p>}
                                {heatmap.map((h, i) => {
                                    const maxCount = Math.max(...heatmap.map(item => item.count), 1);
                                    const percentage = (h.count / maxCount) * 100;
                                    
                                    return (
                                        <div key={i} className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold w-10 text-muted-foreground">{h.hour}</span>
                                            <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-amber-500' : 'bg-primary'}`} 
                                                    style={{ width: `${percentage}%` }} 
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground w-6 text-right">
                                                {h.count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue Gap & No-Show Ranking */}
                    <div className="space-y-8 lg:col-span-6">
                        <Card className="border shadow-sm bg-card">
                            <CardHeader>
                                <CardTitle className="text-lg">Projeção vs. Realizado</CardTitle>
                                <CardDescription>Eficiência de cobrança mensal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                                        <span className="text-muted-foreground">Eficiência</span>
                                        <span className="text-primary">{Math.round((revenue.realized / (revenue.forecasted || 1)) * 100)}%</span>
                                    </div>
                                    <Progress value={(revenue.realized / (revenue.forecasted || 1)) * 100} className="h-3 bg-muted" />
                                </div>
                                <div className="grid grid-cols-2 gap-8 pt-6 border-t">
                                    <div>
                                        <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Projetado</p>
                                        <p className="text-lg font-bold">{formatCurrency(revenue.forecasted)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Realizado</p>
                                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(revenue.realized)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border shadow-sm bg-card">
                            <CardHeader>
                                <CardTitle className="text-lg">Ranking de No-Show (Serviços)</CardTitle>
                                <CardDescription>Onde as faltas mais ocorrem.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {noShowRanking.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-xl border">
                                            <p className="font-bold text-sm">{item.name}</p>
                                            <Badge variant="destructive" className="font-bold">{item.total} faltas</Badge>
                                        </div>
                                    ))}
                                    {noShowRanking.length === 0 && (
                                        <p className="text-center py-6 text-muted-foreground italic text-sm">Nenhum dado de no-show registrado.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
