import React from 'react';
import { Link } from '@inertiajs/react';
import { Edit2, Trash2, Clock, DollarSign, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { route } from '@/utils/route';
import { StatusPill } from '@/components/Shared/StatusPill';

interface Service {
    id: number;
    name: string;
    duration_minutes: number;
    price: string | number;
    color: string | null;
    is_active: boolean;
    description: string | null;
}

interface Props {
    services: Service[];
}

export default function ServicesTable({ services }: Props) {
    const formatPrice = (price: string | number) => {
        const val = typeof price === 'string' ? parseFloat(price) : price;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val);
    };

    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted/30 border-b border-border/40">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Serviço / Descrição</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Duração</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Investimento</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Cor Agenda</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card">
                    {services.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-30">
                                    <Palette className="w-10 h-10" />
                                    <div className="flex flex-col gap-1">
                                        <p className="font-black text-[10px] uppercase tracking-widest">Catálogo vazio</p>
                                        <p className="text-[10px] font-bold uppercase tracking-tighter">Adicione seu primeiro serviço para habilitar agendamentos.</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        services.map((service) => (
                            <tr key={service.id} className="hover:bg-muted/20 transition-all group">
                                <td className="px-6 py-5">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-black text-sm text-foreground tracking-tight uppercase">
                                            {service.name}
                                        </span>
                                        {service.description && (
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider line-clamp-1 mt-0.5">
                                                {service.description}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/40 text-[10px] font-black text-foreground border border-border/40 uppercase tracking-widest">
                                        <Clock className="w-3 h-3 text-primary/60" />
                                        {service.duration_minutes} min
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-black text-foreground tracking-tighter">
                                            {formatPrice(service.price)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div 
                                        className="w-6 h-6 rounded-xl mx-auto border-2 border-background shadow-lg ring-1 ring-border/20 transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: service.color || 'var(--primary)' }}
                                    />
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <StatusPill 
                                        label={service.is_active ? 'ATIVO' : 'INATIVO'} 
                                        variant={service.is_active ? 'success' : 'muted'} 
                                        className="font-black text-[9px] tracking-widest"
                                    />
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={route('configuracoes.services.edit', service.id)}>
                                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link 
                                            href={route('configuracoes.services.destroy', service.id)} 
                                            method="delete" 
                                            as="button"
                                        >
                                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
