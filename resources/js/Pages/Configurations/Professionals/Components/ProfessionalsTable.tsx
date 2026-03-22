import React from 'react';
import { Link } from '@inertiajs/react';
import { Edit2, Trash2, UserCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { route } from '@/utils/route';
import { Badge } from '@/components/ui/badge';

interface Professional {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    is_active: boolean;
    services: { id: number; name: string }[];
}

interface Props {
    professionals: Professional[];
}

export default function ProfessionalsTable({ professionals }: Props) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 dark:bg-zinc-800/50">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Profissional</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Contato</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Especialidade</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Serviços</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {professionals.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                Nenhum profissional encontrado.
                            </td>
                        </tr>
                    ) : (
                        professionals.map((pro) => (
                            <tr key={pro.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <UserCircle className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                {pro.name}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex flex-col gap-1">
                                        {pro.email && (
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Mail className="w-3.5 h-3.5" />
                                                {pro.email}
                                            </div>
                                        )}
                                        {pro.phone && (
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Phone className="w-3.5 h-3.5" />
                                                {pro.phone}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    {pro.specialty || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {pro.services.slice(0, 3).map(svc => (
                                            <Badge key={svc.id} variant="secondary" className="text-[10px] py-0 px-2">
                                                {svc.name}
                                            </Badge>
                                        ))}
                                        {pro.services.length > 3 && (
                                            <span className="text-[10px] text-gray-400 ml-1">+{pro.services.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ring-1 ring-inset ${
                                        pro.is_active 
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                                            : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                        {pro.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={route('configuracoes.professionals.edit', pro.id)}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link 
                                            href={route('configuracoes.professionals.destroy', pro.id)} 
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
