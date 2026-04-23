import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Settings2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    settings: {
        company_name: string;
        slot_duration: number;
        min_advance_minutes: number;
        max_window_days: number;
        timezone: string;
        currency: string;
        no_show_fee_enabled: boolean;
        no_show_fee_amount: number;
        default_buffer_minutes: number;
    };
}

import AppLayout from '@/Layouts/AppLayout';

export default function Index({ settings }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        company_name: settings.company_name || '',
        slot_duration: settings.slot_duration || 30,
        min_advance_minutes: settings.min_advance_minutes || 60,
        max_window_days: settings.max_window_days || 30,
        timezone: settings.timezone || 'America/Sao_Paulo',
        currency: settings.currency || 'BRL',
        no_show_fee_enabled: Boolean(settings.no_show_fee_enabled),
        no_show_fee_amount: Number(settings.no_show_fee_amount),
        default_buffer_minutes: Number(settings.default_buffer_minutes)
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/configuracoes/geral');
    };

    return (
        <>
            <Head title="Geral - Configurações" />
            
            <div className="max-w-4xl space-y-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Parâmetros do Sistema</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ajuste as regras de agendamento e informações da empresa.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Company Section */}
                        <div className="space-y-4 col-span-full">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b pb-2">Identificação</h3>
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Nome da Empresa</Label>
                                <Input
                                    id="company_name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    placeholder="Ex: Barber Shop One"
                                    required
                                />
                                {errors.company_name && <p className="text-xs text-red-500">{errors.company_name}</p>}
                            </div>
                        </div>

                        {/* Scheduling Section */}
                        <div className="space-y-4 col-span-full">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b pb-2">Regras de Agendamento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="slot_duration">Duração do Slot (minutos)</Label>
                                    <Input
                                        id="slot_duration"
                                        type="number"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={data.slot_duration}
                                        onChange={(e) => setData('slot_duration', parseInt(e.target.value))}
                                        required
                                    />
                                    <p className="text-[10px] text-gray-500">Intervalo entre horários no calendário.</p>
                                    {errors.slot_duration && <p className="text-xs text-red-500">{errors.slot_duration}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="min_advance_minutes">Antecedência Mínima (minutos)</Label>
                                    <Input
                                        id="min_advance_minutes"
                                        type="number"
                                        min="0"
                                        value={data.min_advance_minutes}
                                        onChange={(e) => setData('min_advance_minutes', parseInt(e.target.value))}
                                        required
                                    />
                                    <p className="text-[10px] text-gray-500">Tempo mínimo antes do horário para permitir agendamento.</p>
                                    {errors.min_advance_minutes && <p className="text-xs text-red-500">{errors.min_advance_minutes}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_window_days">Janela Máxima de Agendamento (dias)</Label>
                                    <Input
                                        id="max_window_days"
                                        type="number"
                                        min="1"
                                        value={data.max_window_days}
                                        onChange={(e) => setData('max_window_days', parseInt(e.target.value))}
                                        required
                                    />
                                    <p className="text-[10px] text-gray-500">Até quantos dias à frente o cliente pode agendar.</p>
                                    {errors.max_window_days && <p className="text-xs text-red-500">{errors.max_window_days}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="default_buffer_minutes">Buffer Padrão (minutos)</Label>
                                    <Input
                                        id="default_buffer_minutes"
                                        type="number"
                                        min="0"
                                        value={data.default_buffer_minutes}
                                        onChange={(e) => setData('default_buffer_minutes', parseInt(e.target.value))}
                                    />
                                    <p className="text-[10px] text-gray-500">Intervalo automático sugerido entre atendimentos.</p>
                                    {errors.default_buffer_minutes && <p className="text-xs text-red-500">{errors.default_buffer_minutes}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone (Fuso Horário)</Label>
                                    <Select 
                                        value={data.timezone} 
                                        onValueChange={(val) => setData('timezone', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o fuso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/Sao_Paulo">Brasília (BRT)</SelectItem>
                                            <SelectItem value="America/Cuiaba">Cuiabá (AMT)</SelectItem>
                                            <SelectItem value="America/Manaus">Manaus (AMT)</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.timezone && <p className="text-xs text-red-500">{errors.timezone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Moeda (Símbolo)</Label>
                                    <Select 
                                        value={data.currency} 
                                        onValueChange={(val) => setData('currency', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Moeda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BRL">Real (R$)</SelectItem>
                                            <SelectItem value="USD">Dólar (US$)</SelectItem>
                                            <SelectItem value="EUR">Euro (€)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-gray-500">Moeda padrão para cobranças e relatórios.</p>
                                    {errors.currency && <p className="text-xs text-red-500">{errors.currency}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Financial/Penalty Section */}
                        <div className="space-y-4 col-span-full">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 border-b pb-2">Gestão de Faltas & Financeiro</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="no_show_fee_enabled"
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={data.no_show_fee_enabled}
                                            onChange={(e) => setData('no_show_fee_enabled', e.target.checked)}
                                        />
                                        <Label htmlFor="no_show_fee_enabled" className="text-sm font-medium leading-none cursor-pointer">
                                            Cobrar Taxa de No-Show (Falta)
                                        </Label>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic pl-6">Gera uma cobrança automática se o status for alterado para "Falta".</p>
                                </div>

                                {data.no_show_fee_enabled && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label htmlFor="no_show_fee_amount">Valor da Taxa (R$)</Label>
                                        <Input
                                            id="no_show_fee_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.no_show_fee_amount}
                                            onChange={(e) => setData('no_show_fee_amount', parseFloat(e.target.value))}
                                            placeholder="0.00"
                                        />
                                        {errors.no_show_fee_amount && <p className="text-xs text-red-500">{errors.no_show_fee_amount}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t">
                        <div>
                            {recentlySuccessful && (
                                <span className="text-sm text-emerald-600 font-bold animate-pulse">
                                    Configurações salvas com sucesso!
                                </span>
                            )}
                        </div>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="gap-2 px-10 h-11 shadow-lg shadow-primary/20 rounded-xl"
                        >
                            <Save className="w-5 h-5" />
                            {processing ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Configurações Gerais">{page}</ConfigLayout>
    </AppLayout>
);
