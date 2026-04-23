import React from 'react';
import { Link } from '@inertiajs/react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { route } from '@/utils/route';

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
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm transition-all duration-300">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted/50">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Serviço</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Duração</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Preço</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Cor</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {services.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                                Nenhum serviço encontrado.
                            </td>
                        </tr>
                    ) : (
                        services.map((service) => (
                            <tr key={service.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                            {service.name}
                                        </span>
                                        {service.description && (
                                            <span className="text-xs text-muted-foreground/60 line-clamp-1">
                                                {service.description}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                                    {service.duration_minutes} min
                                </td>
                                <td className="px-6 py-4 text-sm text-foreground font-bold">
                                    {formatPrice(service.price)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div 
                                        className="w-6 h-6 rounded-full mx-auto border border-border shadow-inner"
                                        style={{ backgroundColor: service.color || '#3b82f6' }}
                                        title={service.color || 'Padrão'}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ring-1 ring-inset ${
                                        service.is_active 
                                            ? 'bg-success-bg text-success-text ring-success/20' 
                                            : 'bg-muted text-muted-foreground ring-border'
                                    }`}>
                                        {service.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={route('configuracoes.services.edit', service.id)}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link 
                                            href={route('configuracoes.services.destroy', service.id)} 
                                            method="delete" 
                                            as="button"
                                        >
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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
