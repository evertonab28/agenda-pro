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
        <div className="overflow-x-auto rounded-xl border border-border shadow-sm transition-all duration-300">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted/50">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Profissional</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contato</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Especialidade</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Serviços</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {professionals.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                                Nenhum profissional encontrado.
                            </td>
                        </tr>
                    ) : (
                        professionals.map((pro) => (
                            <tr key={pro.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <UserCircle className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                {pro.name}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex flex-col gap-1">
                                        {pro.email && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="w-3.5 h-3.5" />
                                                {pro.email}
                                            </div>
                                        )}
                                        {pro.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="w-3.5 h-3.5" />
                                                {pro.phone}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
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
                                            <span className="text-[10px] text-muted-foreground/60 ml-1">+{pro.services.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ring-1 ring-inset ${
                                        pro.is_active 
                                            ? 'bg-success-bg text-success-text ring-success/20' 
                                            : 'bg-muted text-muted-foreground ring-border'
                                    }`}>
                                        {pro.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={route('configuracoes.professionals.edit', pro.id)}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link 
                                            href={route('configuracoes.professionals.destroy', pro.id)} 
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
