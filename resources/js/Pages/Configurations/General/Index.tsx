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
    };
}

export default function Index({ settings }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        ...settings,
        currency: settings.currency || 'BRL'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/configuracoes/geral');
    };

    return (
        <ConfigLayout title="Configurações Gerais">
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
                                    <Label htmlFor="timezone">Timezone (Fuso Horário)</Label>
                                    <Select 
                                        id="timezone"
                                        value={data.timezone} 
                                        onChange={(e) => setData('timezone', e.target.value)}
                                    >
                                        <SelectItem value="America/Sao_Paulo">Brasília (BRT)</SelectItem>
                                        <SelectItem value="America/Cuiaba">Cuiabá (AMT)</SelectItem>
                                        <SelectItem value="America/Manaus">Manaus (AMT)</SelectItem>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                    </Select>
                                    {errors.timezone && <p className="text-xs text-red-500">{errors.timezone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Moeda (Símbolo)</Label>
                                    <Select 
                                        id="currency"
                                        value={data.currency} 
                                        onChange={(e) => setData('currency', e.target.value)}
                                    >
                                        <SelectItem value="BRL">Real (R$)</SelectItem>
                                        <SelectItem value="USD">Dólar (US$)</SelectItem>
                                        <SelectItem value="EUR">Euro (€)</SelectItem>
                                    </Select>
                                    <p className="text-[10px] text-gray-500">Moeda padrão para cobranças e relatórios.</p>
                                    {errors.currency && <p className="text-xs text-red-500">{errors.currency}</p>}
                                </div>
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
        </ConfigLayout>
    );
}
