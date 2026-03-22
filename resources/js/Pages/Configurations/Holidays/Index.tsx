import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { CalendarDays, Plus, Trash2, Edit2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Pagination from '@/components/Pagination';
import { route } from '@/utils/route';

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
        <ConfigLayout title="Feriados e Datas Bloqueadas">
            <Head title="Feriados - Configurações" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="space-y-6">
                    <div className="p-6 border rounded-2xl bg-gray-50/30 dark:bg-zinc-800/20 space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <Plus className="w-5 h-5" />
                            {editing ? 'Editar Bloqueio' : 'Novo Bloqueio'}
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Descrição / Nome</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex: Feriado Local"
                                    required
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Data</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    required
                                />
                                {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="professional_id">Escopo (Opcional)</Label>
                                <Select 
                                    value={data.professional_id?.toString() || 'global'} 
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setData('professional_id', e.target.value === 'global' ? null : parseInt(e.target.value))}
                                >
                                    <SelectItem value="global">Global (Todo o Sistema)</SelectItem>
                                    {professionals.map(pro => (
                                        <SelectItem key={pro.id} value={pro.id.toString()}>{pro.name}</SelectItem>
                                    ))}
                                </Select>
                                <p className="text-[10px] text-gray-500">Deixe global para bloquear a agenda inteira.</p>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    id="repeats_yearly"
                                    type="checkbox"
                                    checked={data.repeats_yearly}
                                    onChange={(e) => setData('repeats_yearly', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="repeats_yearly" className="text-sm cursor-pointer">Repete anualmente</Label>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <Button type="submit" className="flex-1" disabled={processing}>
                                    {editing ? 'Atualizar' : 'Salvar Bloqueio'}
                                </Button>
                                {editing && (
                                    <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 flex gap-3 text-amber-800 dark:text-amber-200">
                        <Info className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-xs font-medium leading-relaxed">
                            Agendamentos não podem ser realizados em datas bloqueadas ou feriados globais. 
                            Bloqueios por profissional afetam apenas a escala do próprio.
                        </p>
                    </div>
                </div>

                {/* List Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Data</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Descrição</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Escopo</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {holidays.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400">Nenhum feriado cadastrado.</td>
                                    </tr>
                                ) : (
                                    holidays.data.map((holiday) => (
                                        <tr key={holiday.id} className="hover:bg-gray-50/30 dark:hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                                {new Date(holiday.date).toLocaleDateString('pt-BR')}
                                                {holiday.repeats_yearly && <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded uppercase font-bold">Anual</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{holiday.name}</td>
                                            <td className="px-6 py-4">
                                                {holiday.professional ? (
                                                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                                                        {holiday.professional.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 uppercase font-bold tracking-tighter">Global</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => setEditing(holiday)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDelete(holiday.id)}>
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
                    <div className="flex justify-center">
                        <Pagination links={holidays.links} />
                    </div>
                </div>
            </div>
        </ConfigLayout>
    );
}
