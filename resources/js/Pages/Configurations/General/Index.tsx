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
    workspace: {
        public_name: string | null;
        public_description: string | null;
        whatsapp_number: string | null;
        instagram_handle: string | null;
        address_street: string | null;
        address_number: string | null;
        address_complement: string | null;
        address_district: string | null;
        address_city: string | null;
        address_state: string | null;
        address_zip: string | null;
        show_location: boolean;
        show_contact_button: boolean;
    };
}

export default function Index({ settings, workspace }: Props) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        company_name: settings.company_name || '',
        slot_duration: settings.slot_duration || 30,
        min_advance_minutes: settings.min_advance_minutes || 60,
        max_window_days: settings.max_window_days || 30,
        timezone: settings.timezone || 'America/Sao_Paulo',
        currency: settings.currency || 'BRL',
        no_show_fee_enabled: Boolean(settings.no_show_fee_enabled),
        no_show_fee_amount: Number(settings.no_show_fee_amount),
        default_buffer_minutes: Number(settings.default_buffer_minutes),

        // Public Profile fields
        public_name: workspace.public_name || '',
        public_description: workspace.public_description || '',
        whatsapp_number: workspace.whatsapp_number || '',
        instagram_handle: workspace.instagram_handle || '',
        address_street: workspace.address_street || '',
        address_number: workspace.address_number || '',
        address_complement: workspace.address_complement || '',
        address_district: workspace.address_district || '',
        address_city: workspace.address_city || '',
        address_state: workspace.address_state || '',
        address_zip: workspace.address_zip || '',
        show_location: workspace.show_location,
        show_contact_button: workspace.show_contact_button,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/configuracoes/geral');
    };

    return (
        <>
            <Head title="Geral - Configurações" />
            
            <div className="max-w-4xl space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Fantasia (Interno)</Label>
                                    <Input
                                        id="company_name"
                                        className="h-12 rounded-xl bg-muted/30 text-base font-medium"
                                        value={data.company_name}
                                        onChange={(e) => setData('company_name', e.target.value)}
                                        placeholder="Ex: Barber Shop Premium"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="public_name" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Público</Label>
                                    <Input
                                        id="public_name"
                                        className="h-12 rounded-xl bg-muted/30 text-base font-medium"
                                        value={data.public_name}
                                        onChange={(e) => setData('public_name', e.target.value)}
                                        placeholder="Como os clientes verão seu nome"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="public_description" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição / Bio Pública</Label>
                                <Input
                                    id="public_description"
                                    className="h-12 rounded-xl bg-muted/30 text-base"
                                    value={data.public_description}
                                    onChange={(e) => setData('public_description', e.target.value)}
                                    placeholder="Breve descrição do seu negócio para a página inicial"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_number" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp de Contato</Label>
                                    <Input
                                        id="whatsapp_number"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.whatsapp_number}
                                        onChange={(e) => setData('whatsapp_number', e.target.value)}
                                        placeholder="Ex: 11999999999"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="instagram_handle" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Instagram (@usuario)</Label>
                                    <Input
                                        id="instagram_handle"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.instagram_handle}
                                        onChange={(e) => setData('instagram_handle', e.target.value)}
                                        placeholder="Ex: barber.premium"
                                    />
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* Localização */}
                    <SectionCard 
                        title="Localização" 
                        subtitle="Onde seus clientes devem comparecer."
                    >
                        <div className="space-y-6 py-2">
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/40">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <Label htmlFor="show_location" className="text-sm font-black text-foreground tracking-tight cursor-pointer">
                                            Exibir Localização na Página Pública
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Ativa/desativa a seção de mapa e endereço</p>
                                    </div>
                                </div>
                                <label htmlFor="show_location" className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="show_location"
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={data.show_location}
                                        onChange={(e) => setData('show_location', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="address_street" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Logradouro / Rua</Label>
                                    <Input
                                        id="address_street"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.address_street}
                                        onChange={(e) => setData('address_street', e.target.value)}
                                        placeholder="Rua Exemplo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address_number" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Número</Label>
                                    <Input
                                        id="address_number"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.address_number}
                                        onChange={(e) => setData('address_number', e.target.value)}
                                        placeholder="123"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="address_complement" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Complemento</Label>
                                    <Input
                                        id="address_complement"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.address_complement}
                                        onChange={(e) => setData('address_complement', e.target.value)}
                                        placeholder="Sala 1, Bloco A"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address_district" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Bairro</Label>
                                    <Input
                                        id="address_district"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.address_district}
                                        onChange={(e) => setData('address_district', e.target.value)}
                                        placeholder="Centro"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_140px] gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="address_city" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade</Label>
                                    <Input
                                        id="address_city"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.address_city}
                                        onChange={(e) => setData('address_city', e.target.value)}
                                        placeholder="São Paulo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address_state" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">Estado (UF)</Label>
                                    <Input
                                        id="address_state"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.address_state}
                                        onChange={(e) => setData('address_state', e.target.value.toUpperCase().slice(0, 2))}
                                        placeholder="SP"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address_zip" className="text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">CEP</Label>
                                    <Input
                                        id="address_zip"
                                        className="h-12 rounded-xl bg-muted/30 text-base"
                                        value={data.address_zip}
                                        onChange={(e) => setData('address_zip', e.target.value)}
                                        placeholder="00000-000"
                                    />
                                </div>
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
                                <label htmlFor="no_show_fee_enabled" className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="no_show_fee_enabled"
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={data.no_show_fee_enabled}
                                        onChange={(e) => setData('no_show_fee_enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
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
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/40 z-50 lg:left-64">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
