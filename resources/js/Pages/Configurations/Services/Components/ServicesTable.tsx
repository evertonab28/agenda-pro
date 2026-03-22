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
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-800/50">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Serviço</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Duração</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Preço</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-center">Cor</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {services.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                Nenhum serviço encontrado.
                            </td>
                        </tr>
                    ) : (
                        services.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                            {service.name}
                                        </span>
                                        {service.description && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                                                {service.description}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    {service.duration_minutes} min
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-bold">
                                    {formatPrice(service.price)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div 
                                        className="w-6 h-6 rounded-full mx-auto border border-gray-200 dark:border-zinc-700 shadow-inner"
                                        style={{ backgroundColor: service.color || '#3b82f6' }}
                                        title={service.color || 'Padrão'}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ring-1 ring-inset ${
                                        service.is_active 
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                                            : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                        {service.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={route('configuracoes.services.edit', service.id)}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link 
                                            href={route('configuracoes.services.destroy', service.id)} 
                                            method="delete" 
                                            as="button"
                                        >
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50">
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
