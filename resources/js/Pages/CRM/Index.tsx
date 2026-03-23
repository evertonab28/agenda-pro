import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, AlertTriangle, UserMinus, UserCheck, Star, ArrowRight } from 'lucide-react';
import { route } from '@/utils/route';

interface Props {
    stats: Record<string, number>;
    segments: Record<string, string>;
    avg_nps: number;
}

export default function CRMIndex({ stats, segments, avg_nps }: Props) {
    const getIcon = (segment: string) => {
        switch (segment) {
            case 'VIP': return <Star className="w-5 h-5 text-amber-500" />;
            case 'Recorrente': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
            case 'Ativo': return <UserCheck className="w-5 h-5 text-blue-500" />;
            case 'Em Risco': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'Inativo': return <UserMinus className="w-5 h-5 text-red-500" />;
            default: return <Users className="w-5 h-5 text-zinc-400" />;
        }
    };

    const getColorClass = (segment: string) => {
        switch (segment) {
            case 'VIP': return 'bg-amber-50 border-amber-200';
            case 'Recorrente': return 'bg-emerald-50 border-emerald-200';
            case 'Ativo': return 'bg-blue-50 border-blue-200';
            case 'Em Risco': return 'bg-orange-50 border-orange-200';
            case 'Inativo': return 'bg-red-50 border-red-200';
            default: return 'bg-zinc-50 border-zinc-200';
        }
    };

    return (
        <AppLayout>
            <Head title="CRM & Inteligência" />
            
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">CRM & Retenção</h1>
                        <p className="text-muted-foreground">Entenda o comportamento da sua base de clientes e tome ações proativas.</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <Star className="w-6 h-6 fill-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">NPS Médio</p>
                            <p className="text-2xl font-black">{avg_nps || '---'}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(segments).map(([name, description]) => (
                        <Card key={name} className={`border-none shadow-sm hover:shadow-md transition-all ${getColorClass(name)}`}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-lg bg-white shadow-sm">
                                        {getIcon(name)}
                                    </div>
                                    <Badge variant="secondary" className="font-bold text-lg">
                                        {stats[name] || 0}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4">{name}</CardTitle>
                                <CardDescription className="text-zinc-600 font-medium">{description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Link href={route('crm.segment', name)}>
                                    <Button variant="ghost" className="w-full justify-between group p-0 hover:bg-transparent font-bold text-primary">
                                        Ver Clientes 
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="bg-zinc-900 text-white border-none overflow-hidden">
                    <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-2xl font-bold">Campanhas de Reativação</h2>
                            <p className="text-zinc-400 max-w-md">Selecione um segmento (como Inativos ou Em Risco) para obter a lista de contato e enviar uma oferta especial via WhatsApp.</p>
                        </div>
                        <div className="flex gap-4">
                            <Badge className="bg-primary/20 text-primary py-2 px-4 text-sm border-primary/30">DICA: Ofereça 10% OFF para Inativos</Badge>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
