import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { CalendarDays, Plus, Trash2, Edit2, Info, Globe, User, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Pagination from '@/components/Pagination';
import { route } from '@/utils/route';
import AppLayout from '@/Layouts/AppLayout';
import { SectionCard } from '@/components/Shared/SectionCard';

interface Holiday {
    id: number;
    name: string;
    date: string;
    repeats_yearly: boolean;
    professional_id: number | null;
    professional?: { id: number; name: string };
}

interface Professional {
    id: number;
    name: string;
}

interface Props {
    holidays: {
        data: Holiday[];
        links: any[];
    };
    professionals: Professional[];
}

export default function Index({ holidays, professionals }: Props) {
    const [editing, setEditing] = React.useState<Holiday | null>(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        date: '',
        professional_id: null as number | null,
        repeats_yearly: false,
    });

    React.useEffect(() => {
        if (editing) {
            setData({
                name: editing.name,
                date: editing.date,
                professional_id: editing.professional_id,
                repeats_yearly: editing.repeats_yearly,
            });
        } else {
            reset();
        }
    }, [editing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(route('configuracoes.holidays.update', editing.id), {
                onSuccess: () => setEditing(null),
            });
        } else {
            post(route('configuracoes.holidays.store'), {
                onSuccess: () => reset(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Deseja excluir este feriado/bloqueio?')) {
            destroy(route('configuracoes.holidays.destroy', id));
        }
    };

    return (
        <>
            <Head title="Feriados - Configurações" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Column */}
                <div className="lg:col-span-4 space-y-6">
                    <SectionCard 
                        title={editing ? "Editar Bloqueio" : "Novo Bloqueio"} 
                        subtitle="Defina datas onde a agenda deve estar fechada."
                    >
                        <form onSubmit={handleSubmit} className="space-y-6 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Descrição / Nome</Label>
                                <Input
                                    id="name"
                                    className="h-11 rounded-xl bg-muted/30"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Feriado Local"
                                    required
                                />
                                {errors.name && <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Data do Bloqueio</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    className="h-11 rounded-xl bg-muted/30"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    required
                                />
                                {errors.date && <p className="text-[10px] text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="professional_id" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Escopo de Bloqueio</Label>
                                <Select 
                                    value={data.professional_id?.toString() || 'global'} 
                                    onValueChange={(val) => setData('professional_id', val === 'global' ? null : parseInt(val))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/40">
                                        <SelectValue placeholder="Selecione o escopo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="global">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" />
                                                Todo o Estabelecimento
                                            </div>
                                        </SelectItem>
                                        {professionals.map(pro => (
                                            <SelectItem key={pro.id} value={pro.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5" />
                                                    {pro.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest ml-1 mt-1">Afeta apenas o profissional selecionado ou todos.</p>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/40 cursor-pointer group" onClick={() => setData('repeats_yearly', !data.repeats_yearly)}>
                                <div className="relative inline-flex items-center">
                                    <input
                                        id="repeats_yearly"
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={data.repeats_yearly}
                                        onChange={(e) => setData('repeats_yearly', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                                <div>
                                    <Label htmlFor="repeats_yearly" className="text-xs font-black text-foreground tracking-tight cursor-pointer">
                                        Repete Anualmente
                                    </Label>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Útil para feriados fixos</p>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 rounded-xl font-bold uppercase tracking-wider text-xs gap-2" disabled={processing}>
                                    <Plus className="w-4 h-4" />
                                    {editing ? 'Atualizar' : 'Salvar Bloqueio'}
                                </Button>
                                {editing && (
                                    <Button type="button" variant="ghost" className="rounded-xl h-11 font-bold uppercase text-[10px]" onClick={() => setEditing(null)}>
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </form>
                    </SectionCard>

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-xs text-foreground/80 leading-relaxed">
                            <p className="font-black uppercase tracking-wider text-[10px] text-primary mb-1">Importante</p>
                            <p className="font-medium">Agendamentos não podem ser realizados em datas bloqueadas globais.</p>
                        </div>
                    </div>
                </div>

                {/* List Column */}
                <div className="lg:col-span-8 space-y-6">
                    <SectionCard noPadding>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/40">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data do Bloqueio</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Escopo / Aplicação</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {holidays.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-3 opacity-30">
                                                    <CalendarDays className="w-12 h-12" />
                                                    <p className="text-sm font-medium">Nenhum feriado ou bloqueio cadastrado.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        holidays.data.map((holiday) => (
                                            <tr key={holiday.id} className="hover:bg-muted/20 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-black text-[10px] shadow-inner">
                                                            {new Date(holiday.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-foreground tracking-tight">
                                                                {new Date(holiday.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: '2-digit' })}
                                                            </p>
                                                            {holiday.repeats_yearly && (
                                                                <div className="flex items-center gap-1 text-[9px] text-info-text font-black uppercase tracking-widest mt-0.5">
                                                                    <RotateCw className="w-2.5 h-2.5" />
                                                                    Recorrência Anual
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{holiday.name}</td>
                                                <td className="px-6 py-4">
                                                    {holiday.professional ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-warning-bg text-warning-text border border-warning/20 text-[10px] font-black uppercase tracking-widest">
                                                            <User className="w-3 h-3" />
                                                            {holiday.professional.name}
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/40 text-[10px] font-black uppercase tracking-widest">
                                                            <Globe className="w-3 h-3" />
                                                            Global
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary hover:bg-primary/5" onClick={() => setEditing(holiday)}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/5" onClick={() => handleDelete(holiday.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                    <div className="flex justify-center">
                        <Pagination links={holidays.links} />
                    </div>
                </div>
            </div>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Feriados e Bloqueios">{page}</ConfigLayout>
    </AppLayout>
);
