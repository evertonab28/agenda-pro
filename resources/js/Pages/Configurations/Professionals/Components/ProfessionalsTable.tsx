import React from 'react';
import { Link } from '@inertiajs/react';
import { Edit2, Trash2, UserCircle, Phone, Mail, Award, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { route } from '@/utils/route';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/Shared/StatusPill';

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
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted/30 border-b border-border/40">
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Especialista</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Contatos Diretos</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Especialidade</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Serviços Ativos</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                        <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Gestão</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-card">
                    {professionals.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-40">
                                    <UserCircle className="w-10 h-10" />
                                    <div className="flex flex-col gap-1">
                                        <p className="font-black text-[10px] uppercase tracking-widest">Nenhum profissional listado</p>
                                        <p className="text-[10px] font-bold uppercase tracking-tighter">Inicie a escala adicionando o primeiro membro.</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        professionals.map((pro) => (
                            <tr key={pro.id} className="hover:bg-muted/20 transition-all group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10 bg-primary/5 transition-transform group-hover:scale-105">
                                            <UserCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-sm text-foreground tracking-tight truncate">
                                                {pro.name}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground opacity-60 tracking-wider leading-none mt-0.5">ID: #{pro.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        {pro.email && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground truncate">
                                                <Mail className="w-3.5 h-3.5 text-primary/40" />
                                                {pro.email.toLowerCase()}
                                            </div>
                                        )}
                                        {pro.phone && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <Phone className="w-3.5 h-3.5 text-primary/40" />
                                                {pro.phone}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-info-text opacity-40" />
                                        <span className="text-xs font-black uppercase text-foreground tracking-tight">
                                            {pro.specialty || 'GERAL'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                        {pro.services.slice(0, 3).map(svc => (
                                            <Badge key={svc.id} variant="outline" className="text-[10px] py-0.5 px-2 bg-muted/30 text-foreground/70 border-border/40 font-bold uppercase tracking-widest rounded-lg">
                                                {svc.name}
                                            </Badge>
                                        ))}
                                        {pro.services.length > 3 && (
                                            <span className="text-xs text-muted-foreground/40 font-black tracking-widest pl-1">+{pro.services.length - 3}</span>
                                        )}
                                        {pro.services.length === 0 && (
                                            <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest italic">Sem serviços</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <StatusPill 
                                        label={pro.is_active ? 'ATIVO' : 'INATIVO'} 
                                        variant={pro.is_active ? 'success' : 'muted'} 
                                        className="font-black text-[10px] tracking-widest"
                                    />
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={route('configuracoes.professionals.edit', pro.id)}>
                                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                        <Link 
                                            href={route('configuracoes.professionals.destroy', pro.id)} 
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
