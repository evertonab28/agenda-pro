import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Settings2, Save, Building2, CalendarRange, Wallet, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { SectionCard } from '@/components/Shared/SectionCard';

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
            
            <div className="max-w-4xl space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Identificação */}
                    <SectionCard 
                        title="Identificação da Empresa" 
                        subtitle="Como seu negócio será identificado no sistema e para os clientes."
                    >
                        <div className="space-y-6 py-2">
                            <div className="flex items-center gap-4 mb-2 p-4 bg-muted/20 rounded-2xl border border-border/40">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-foreground tracking-tight uppercase text-base">Perfil do Estabelecimento</h4>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Dados públicos e de cabeçalho</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company_name" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Fantasia</Label>
                                <Input
                                    id="company_name"
                                    className="h-12 rounded-xl bg-muted/30 text-base font-medium"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    placeholder="Ex: Barber Shop Premium"
                                    required
                                />
                                {errors.company_name && <p className="text-sm text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.company_name}</p>}
                            </div>
                        </div>
                    </SectionCard>

                    {/* Regras de Agendamento */}
                    <SectionCard 
                        title="Regras de Agendamento" 
                        subtitle="Defina o comportamento inteligente do seu calendário de serviços."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="slot_duration" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Duração do Slot (min)</Label>
                                <Input
                                    id="slot_duration"
                                    type="number"
                                    className="h-12 rounded-xl bg-muted/30 text-base"
                                    value={data.slot_duration}
                                    onChange={(e) => setData('slot_duration', parseInt(e.target.value))}
                                    required
                                />
                                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest ml-1">Intervalo mínimo entre horários</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="min_advance_minutes" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Antecedência Mínima (min)</Label>
                                <Input
                                    id="min_advance_minutes"
                                    type="number"
                                    className="h-12 rounded-xl bg-muted/30 text-base"
                                    value={data.min_advance_minutes}
                                    onChange={(e) => setData('min_advance_minutes', parseInt(e.target.value))}
                                    required
                                />
                                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest ml-1">Tempo limite para marcar</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_window_days" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Janela Máxima (dias)</Label>
                                <Input
                                    id="max_window_days"
                                    type="number"
                                    className="h-12 rounded-xl bg-muted/30 text-base"
                                    value={data.max_window_days}
                                    onChange={(e) => setData('max_window_days', parseInt(e.target.value))}
                                    required
                                />
                                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest ml-1">Limite de dias à frente</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="default_buffer_minutes" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Buffer Padrão (min)</Label>
                                <Input
                                    id="default_buffer_minutes"
                                    type="number"
                                    className="h-12 rounded-xl bg-muted/30 text-base"
                                    value={data.default_buffer_minutes}
                                    onChange={(e) => setData('default_buffer_minutes', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest ml-1">Intervalo de descanso/limpeza</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Timezone / Fuso Horário</Label>
                                <Select 
                                    value={data.timezone} 
                                    onValueChange={(val) => setData('timezone', val)}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/40 text-sm font-bold">
                                        <SelectValue placeholder="Selecione o fuso" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/Sao_Paulo">Brasília (BRT)</SelectItem>
                                        <SelectItem value="America/Cuiaba">Cuiabá (AMT)</SelectItem>
                                        <SelectItem value="America/Manaus">Manaus (AMT)</SelectItem>
                                        <SelectItem value="UTC">UTC (Global)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Moeda Padrão</Label>
                                <Select 
                                    value={data.currency} 
                                    onValueChange={(val) => setData('currency', val)}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/40 text-sm font-bold">
                                        <SelectValue placeholder="Moeda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                                        <SelectItem value="USD">Dólar Americano (US$)</SelectItem>
                                        <SelectItem value="EUR">Euro (€)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Financeiro / Faltas */}
                    <SectionCard 
                        title="Políticas Financeiras" 
                        subtitle="Regras de cobrança para proteger sua receita contra faltas."
                    >
                        <div className="space-y-6 py-2">
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/40">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-warning-bg flex items-center justify-center text-warning-text">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <Label htmlFor="no_show_fee_enabled" className="text-sm font-black text-foreground tracking-tight cursor-pointer">
                                            Taxa de No-Show (Falta)
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Cobrança por não comparecimento</p>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="no_show_fee_enabled"
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={data.no_show_fee_enabled}
                                        onChange={(e) => setData('no_show_fee_enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                            </div>

                            {data.no_show_fee_enabled && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2 max-w-xs">
                                        <Label htmlFor="no_show_fee_amount" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor da Taxa (R$)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">R$</span>
                                            <Input
                                                id="no_show_fee_amount"
                                                type="number"
                                                step="0.01"
                                                className="h-11 pl-10 rounded-xl bg-muted/30 font-black text-lg"
                                                value={data.no_show_fee_amount}
                                                onChange={(e) => setData('no_show_fee_amount', parseFloat(e.target.value))}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.no_show_fee_amount && <p className="text-xs text-destructive font-bold uppercase tracking-wider mt-1 ml-1">{errors.no_show_fee_amount}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2">
                            {recentlySuccessful && (
                                <div className="flex items-center gap-2 text-success font-black uppercase text-xs tracking-widest animate-in fade-in slide-in-from-left-2 duration-300 bg-success/10 px-3 py-1.5 rounded-lg border border-success/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Configurações atualizadas!
                                </div>
                            )}
                        </div>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-12 px-10 rounded-xl font-bold uppercase tracking-wider text-xs gap-2"
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
