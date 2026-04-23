import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, AlertTriangle, UserMinus, UserCheck, Star, ArrowRight, Zap } from 'lucide-react';
import { route } from '@/utils/route';
import { PageHeader } from '@/Components/Shared/PageHeader';
import { MetricCard } from '@/Components/Shared/MetricCard';
import { SectionCard } from '@/Components/Shared/SectionCard';

interface Props {
    stats: Record<string, number>;
    segments: Record<string, string>;
    avg_nps: number;
}

export default function CRMIndex({ stats, segments, avg_nps }: Props) {
    const getIcon = (segment: string) => {
        switch (segment) {
            case 'VIP': return <Star size={18} />;
            case 'Recorrente': return <TrendingUp size={18} />;
            case 'Ativo': return <UserCheck size={18} />;
            case 'Em Risco': return <AlertTriangle size={18} />;
            case 'Inativo': return <UserMinus size={18} />;
            default: return <Users size={18} />;
        }
    };

    const getColor = (segment: string) => {
        switch (segment) {
            case 'VIP': return 'var(--warning)';
            case 'Recorrente': return 'var(--success)';
            case 'Ativo': return 'var(--primary)';
            case 'Em Risco': return 'var(--destructive)';
            case 'Inativo': return 'var(--muted-foreground)';
            default: return 'var(--muted-foreground)';
        }
    };

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
            <Head title="CRM & Inteligência" />
            
            <PageHeader 
                title="CRM & Retenção" 
                subtitle="Entenda o comportamento da sua base de clientes e tome ações proativas."
                action={
                    <div className="flex items-center gap-4 bg-card border rounded-2xl px-4 py-2 shadow-sm">
                         <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center text-warning">
                            <Star className="w-5 h-5 fill-warning" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-tight">NPS Médio</p>
                            <p className="text-xl font-black text-foreground">{avg_nps || '---'}</p>
                        </div>
                    </div>
                }
            />

            {/* Segments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(segments).map(([name, description]) => (
                    <SectionCard
                        key={name}
                        title={name}
                        subtitle={description}
                        headerAction={
                            <div 
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ 
                                    background: `color-mix(in srgb, ${getColor(name)}, transparent 85%)`,
                                    color: getColor(name)
                                }}
                            >
                                {getIcon(name)}
                            </div>
                        }
                        footer={
                            <Link href={route('crm.segment', name)} className="w-full">
                                <Button variant="ghost" className="w-full justify-between group h-9 font-bold text-primary hover:bg-primary/5 rounded-lg px-0">
                                    <span className="px-5">Ver Clientes</span>
                                    <div className="px-4">
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Button>
                            </Link>
                        }
                    >
                        <div className="py-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tight text-foreground">
                                    {stats[name] || 0}
                                </span>
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                    Clientes
                                </span>
                            </div>
                        </div>
                    </SectionCard>
                ))}
            </div>

            {/* Campaign CTA */}
            <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 md:p-12 text-background shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl -ml-24 -mb-24" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            <Zap size={12} className="fill-current" />
                            Dica de Marketing
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">Campanhas de Reativação</h2>
                        <p className="text-background/70 max-w-xl font-medium leading-relaxed">
                            Selecione um segmento (como Inativos ou Em Risco) para obter a lista de contato e enviar uma oferta especial via WhatsApp. 
                            <span className="block mt-2 font-bold text-primary-foreground">Sugestão: Ofereça 10% OFF para reconquistar clientes inativos hoje.</span>
                        </p>
                    </div>
                    <Button className="bg-background text-foreground hover:bg-background/90 h-14 px-8 rounded-2xl font-black text-sm transition-transform active:scale-95 flex-shrink-0">
                        Começar Campanha
                    </Button>
                </div>
            </div>
        </div>
    );
}

CRMIndex.layout = (page: any) => <AppLayout children={page} />;

