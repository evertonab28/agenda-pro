import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, AlertTriangle, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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
}

export default function ExecutiveDashboard({ heatmap, revenue, noShowRanking, retention }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <AppLayout>
            <Head title="BI Executivo - Performance" />

            <div className="space-y-8 pb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
                    <p className="text-muted-foreground">Visão estratégica de performance, finanças e retenção.</p>
                </div>

                {/* Top KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-12 h-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Receita Realizada</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-black text-emerald-600">{formatCurrency(revenue.realized)}</p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-muted-foreground">
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                {Math.round((revenue.realized / (revenue.forecasted || 1)) * 100)}% do projetado
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative">
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

                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative">
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

                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="w-12 h-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ocupação Média</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Simple logic for avg density */}
                            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                                {Math.round(heatmap.reduce((acc, h) => acc + h.count, 0) / (heatmap.length || 1) * 10)}%
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-muted-foreground uppercase">
                                Últimos 30 dias
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Heatmap Section */}
                    <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
                        <CardHeader>
                            <CardTitle className="text-lg">Densidade de Atendimentos</CardTitle>
                            <CardDescription>Horários com maior volume nos últimos 30 dias.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {heatmap.map((h, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold w-8 text-muted-foreground">{h.hour}</span>
                                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-primary h-full transition-all duration-1000" 
                                                style={{ width: `${Math.min(h.count * 10, 100)}%` }} 
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-primary">{h.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue Gap & No-Show Ranking */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
                            <CardHeader>
                                <CardTitle className="text-lg">Projeção vs. Realizado</CardTitle>
                                <CardDescription>Eficiência de cobrança mensal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span>Eficiência</span>
                                        <span>{Math.round((revenue.realized / (revenue.forecasted || 1)) * 100)}%</span>
                                    </div>
                                    <Progress value={(revenue.realized / (revenue.forecasted || 1)) * 100} className="h-3 bg-zinc-100 dark:bg-zinc-800" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Projetado</p>
                                        <p className="font-bold">{formatCurrency(revenue.forecasted)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Realizado</p>
                                        <p className="font-bold text-emerald-600">{formatCurrency(revenue.realized)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white dark:bg-zinc-900">
                            <CardHeader>
                                <CardTitle className="text-lg">Ranking de No-Show (Serviços)</CardTitle>
                                <CardDescription>Onde as faltas mais ocorrem.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {noShowRanking.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border">
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
