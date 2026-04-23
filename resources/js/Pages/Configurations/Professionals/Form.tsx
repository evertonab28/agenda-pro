import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { UserCircle, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { route } from '@/utils/route';
import { Badge } from '@/components/ui/badge';

interface Service {
    id: number;
    name: string;
}

interface Professional {
    id?: number;
    name: string;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    is_active: boolean;
    services: { id: number; name: string }[];
}

interface Props {
    professional?: Professional;
    services: Service[];
}

export default function Form({ professional, services }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: professional?.name || '',
        email: professional?.email || '',
        phone: professional?.phone || '',
        specialty: professional?.specialty || '',
        is_active: professional?.is_active ?? true,
        services: professional?.services.map(s => s.id) || [] as number[],
    });

    const isServiceSelected = (id: number) => data.services.includes(id);

    const toggleService = (id: number) => {
        if (isServiceSelected(id)) {
            setData('services', data.services.filter(sid => sid !== id));
        } else {
            setData('services', [...data.services, id]);
        }
    };

    const isCreating = !professional?.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isCreating && data.services.length === 0) return;
        if (professional?.id) {
            put(route('configuracoes.professionals.update', professional.id));
        } else {
            post(route('configuracoes.professionals.store'));
        }
    };

    return (
        <ConfigLayout title={professional?.id ? 'Editar Profissional' : 'Novo Profissional'}>
            <Head title={`${professional?.id ? 'Editar' : 'Novo'} Profissional - Configurações`} />
            
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href={route('configuracoes.professionals.index')}>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <UserCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {professional?.id ? 'Editar Profissional' : 'Cadastrar Profissional'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {professional?.id ? `Atualizando dados de ${professional.name}` : 'Insira as informações básicas do novo profissional.'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-gray-50/30 dark:bg-zinc-800/20">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Nome do profissional"
                                required
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialty">Especialidade / Cargo</Label>
                            <Input
                                id="specialty"
                                value={data.specialty || ''}
                                onChange={(e) => setData('specialty', e.target.value)}
                                placeholder="Ex: Cabeleireiro Senior"
                            />
                            {errors.specialty && <p className="text-sm text-red-500">{errors.specialty}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email || ''}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="profissional@exemplo.com"
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={data.phone || ''}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <input
                                id="is_active"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                            <Label htmlFor="is_active" className="text-sm font-medium leading-none cursor-pointer">
                                Profissional Ativo
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Serviços Atendidos</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Selecione quais serviços este profissional está habilitado a realizar.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {services.map((service) => {
                                const selected = isServiceSelected(service.id);
                                return (
                                    <div
                                        key={service.id}
                                        onClick={() => toggleService(service.id)}
                                        className={`
                                            cursor-pointer flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all
                                            ${selected 
                                                ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10' 
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-zinc-900 dark:border-zinc-800'
                                            }
                                        `}
                                    >
                                        <span className="truncate">{service.name}</span>
                                        {selected && <Check className="w-4 h-4 shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                        {errors.services && <p className="text-sm text-red-500">{errors.services}</p>}
                        {isCreating && data.services.length === 0 && services.length > 0 && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                Selecione ao menos um serviço para cadastrar o profissional.
                            </p>
                        )}
                        {services.length === 0 && (
                            <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed text-gray-500 text-sm">
                                Nenhum serviço ativo cadastrado. 
                                <Link href={route('configuracoes.services.create')} className="text-primary font-bold ml-1 hover:underline">
                                    Cadastre um serviço primeiro.
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6 gap-3 border-t">
                        <Link href={route('configuracoes.professionals.index')}>
                            <Button variant="outline" type="button" className="px-8 rounded-xl h-11">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || (isCreating && data.services.length === 0)}
                            className="px-10 rounded-xl h-11 shadow-lg shadow-primary/20"
                        >
                            {processing ? 'Salvando...' : (professional?.id ? 'Salvar Alterações' : 'Cadastrar Profissional')}
                        </Button>
                    </div>
                </form>
            </div>
        </ConfigLayout>
    );
}
