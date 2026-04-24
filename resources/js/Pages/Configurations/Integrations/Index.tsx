import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import {
    CreditCard,
    MessageSquare,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
    ExternalLink,
    Zap,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import { SectionCard } from '@/components/Shared/SectionCard';
import { StatusPill } from '@/components/Shared/StatusPill';

interface Integration {
    id: number;
    type: 'payment' | 'messaging';
    provider: string;
    status: 'active' | 'error' | 'pending';
    last_check_at: string | null;
    credentials: Record<string, string>;
}

interface Props {
    integrations: Integration[];
}

export default function Index({ integrations }: Props) {
    const [testingId, setTestingId] = useState<number | null>(null);
    const [testResults, setTestResults] = useState<Record<number, { ok: boolean; message?: string }>>({});
    const [savingProvider, setSavingProvider] = useState<string | null>(null);
    const [saveResults, setSaveResults] = useState<Record<string, { ok: boolean; message?: string }>>({});

    const asaas = integrations.find(i => i.provider === 'asaas');
    const evolution = integrations.find(i => i.provider === 'evolution');

    const [asaasKey, setAsaasKey] = useState('');
    const [evoUrl, setEvoUrl] = useState('');
    const [evoInstance, setEvoInstance] = useState('');
    const [evoKey, setEvoKey] = useState('');

    const handleSave = async (payload: object, provider: string) => {
        setSavingProvider(provider);
        setSaveResults(prev => ({ ...prev, [provider]: undefined as any }));
        try {
            await axios.post('/api/workspace-integrations', payload);
            setSaveResults(prev => ({ ...prev, [provider]: { ok: true } }));
            router.reload({ only: ['integrations'] });
        } catch (error: any) {
            setSaveResults(prev => ({
                ...prev,
                [provider]: { ok: false, message: error.response?.data?.message || 'Erro ao salvar' },
            }));
        } finally {
            setSavingProvider(null);
        }
    };

    const testConnection = async (integrationId: number) => {
        setTestingId(integrationId);
        try {
            await axios.post(`/api/workspace-integrations/${integrationId}/test-connection`);
            setTestResults(prev => ({ ...prev, [integrationId]: { ok: true } }));
        } catch (error: any) {
            setTestResults(prev => ({
                ...prev,
                [integrationId]: {
                    ok: false,
                    message: error.response?.data?.message || 'Falha na conexão',
                },
            }));
        } finally {
            setTestingId(null);
        }
    };

    return (
        <>
            <Head title="Integrações - Configurações" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
                {/* ASAAS CARD */}
                <SectionCard 
                    title="Pagamentos (Asaas)" 
                    subtitle="Configure o gateway para recebimentos automáticos e gestão financeira."
                    headerAction={asaas && <StatusPill label={asaas.status.toUpperCase()} variant={asaas.status === 'active' ? 'success' : asaas.status === 'error' ? 'destructive' : 'muted'} />}
                >
                    <div className="space-y-6 py-2">
                        <div className="flex items-center gap-4 mb-4 p-4 bg-muted/20 rounded-2xl border border-border/40">
                            <div className="w-12 h-12 rounded-xl bg-info-bg flex items-center justify-center text-info-text shadow-sm">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-foreground tracking-tight uppercase text-xs">Provedor Asaas</h4>
                                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Gateway de Pagamentos & Antecipação</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="asaas_api_key" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">API Key (Produção ou Sandbox)</Label>
                            <Input
                                id="asaas_api_key"
                                type="password"
                                className="h-11 rounded-xl bg-muted/30"
                                placeholder={asaas ? '••••••••••••••••••••••••••••' : 'Insira sua chave do Asaas'}
                                value={asaasKey}
                                onChange={e => setAsaasKey(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                className="flex-1 h-10 rounded-xl font-bold uppercase text-[10px] tracking-wider"
                                onClick={() => handleSave({ type: 'payment', provider: 'asaas', credentials: { api_key: asaasKey } }, 'asaas')}
                                disabled={savingProvider === 'asaas' || !asaasKey}
                            >
                                {savingProvider === 'asaas' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                {asaas ? 'Atualizar Chave' : 'Configurar'}
                            </Button>

                            {asaas && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl border-border/60"
                                    onClick={() => testConnection(asaas.id)}
                                    disabled={testingId === asaas.id}
                                >
                                    {testingId === asaas.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </Button>
                            )}
                        </div>

                        {(saveResults['asaas'] || (asaas && testResults[asaas.id])) && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {saveResults['asaas'] && (
                                    <div className={`p-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border ${saveResults['asaas'].ok ? 'bg-success-bg/30 text-success-text border-success/20' : 'bg-destructive-bg/30 text-destructive-text border-destructive/20'}`}>
                                        {saveResults['asaas'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                        {saveResults['asaas'].ok ? 'Configuração salva!' : saveResults['asaas'].message}
                                    </div>
                                )}

                                {asaas && testResults[asaas.id] && !saveResults['asaas'] && (
                                    <div className={`p-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border ${testResults[asaas.id].ok ? 'bg-success-bg/30 text-success-text border-success/20' : 'bg-destructive-bg/30 text-destructive-text border-destructive/20'}`}>
                                        {testResults[asaas.id].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                        {testResults[asaas.id].ok ? 'Conexão estabelecida!' : testResults[asaas.id].message}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="p-4 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                            <a href="https://www.asaas.com" target="_blank" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5 hover:text-primary transition-colors">
                                <ExternalLink className="w-3 h-3" />
                                Pegar chaves no painel do Asaas
                            </a>
                        </div>
                    </div>
                </SectionCard>

                {/* EVOLUTION CARD */}
                <SectionCard 
                    title="WhatsApp (Evolution)" 
                    subtitle="Automatize o envio de lembretes e confirmações por WhatsApp."
                    headerAction={evolution && <StatusPill label={evolution.status.toUpperCase()} variant={evolution.status === 'active' ? 'success' : evolution.status === 'error' ? 'destructive' : 'muted'} />}
                >
                    <div className="space-y-6 py-2">
                        <div className="flex items-center gap-4 mb-4 p-4 bg-muted/20 rounded-2xl border border-border/40">
                            <div className="w-12 h-12 rounded-xl bg-success-bg flex items-center justify-center text-success-text shadow-sm">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-foreground tracking-tight uppercase text-xs">Evolution API</h4>
                                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Mensageria & Automação</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className="space-y-2">
                                <Label htmlFor="evo-url" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">1</span>
                                    URL da API
                                </Label>
                                <Input
                                    id="evo-url"
                                    className="h-10 rounded-xl bg-muted/30 text-xs"
                                    placeholder="https://api.seudominio.com"
                                    value={evoUrl}
                                    onChange={(e) => setEvoUrl(e.target.value)}
                                />
                            </div>

                            {/* Step 2 */}
                            <div className="space-y-2">
                                <Label htmlFor="evo-instance" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">2</span>
                                    Instância
                                </Label>
                                <Input
                                    id="evo-instance"
                                    className="h-10 rounded-xl bg-muted/30 text-xs"
                                    placeholder="ex: barbearia-pro"
                                    value={evoInstance}
                                    onChange={(e) => setEvoInstance(e.target.value)}
                                />
                            </div>

                            {/* Step 3 */}
                            <div className="space-y-2">
                                <Label htmlFor="evo-key" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">3</span>
                                    Chave de API
                                </Label>
                                <Input
                                    id="evo-key"
                                    type="password"
                                    className="h-10 rounded-xl bg-muted/30 text-xs"
                                    placeholder="Sua API Key"
                                    value={evoKey}
                                    onChange={(e) => setEvoKey(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                className="flex-1 h-10 rounded-xl font-bold uppercase text-[10px] tracking-wider"
                                disabled={!evoUrl || !evoInstance || !evoKey || savingProvider === 'evolution'}
                                onClick={() =>
                                    handleSave(
                                        { type: 'messaging', provider: 'evolution', credentials: { api_key: evoKey, instance_name: evoInstance, base_url: evoUrl } },
                                        'evolution',
                                    )
                                }
                            >
                                {savingProvider === 'evolution' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                Salvar Configuração
                            </Button>
                            {evolution && (
                                <Button
                                    variant="outline"
                                    className="h-10 rounded-xl border-border/60 font-bold uppercase text-[10px] tracking-wider px-4"
                                    disabled={testingId === evolution.id}
                                    onClick={() => testConnection(evolution.id)}
                                >
                                    {testingId === evolution.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Testar'}
                                </Button>
                            )}
                        </div>

                        {(saveResults['evolution'] || (evolution && testResults[evolution.id])) && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {saveResults['evolution'] && (
                                    <div className={`p-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border ${saveResults['evolution'].ok ? 'bg-success-bg/30 text-success-text border-success/20' : 'bg-destructive-bg/30 text-destructive-text border-destructive/20'}`}>
                                        {saveResults['evolution'].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                        {saveResults['evolution'].ok ? 'Configuração salva!' : saveResults['evolution'].message || 'Erro ao salvar.'}
                                    </div>
                                )}

                                {evolution && testResults[evolution.id] && !saveResults['evolution'] && (
                                    <div className={`p-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border ${testResults[evolution.id].ok ? 'bg-success-bg/30 text-success-text border-success/20' : 'bg-destructive-bg/30 text-destructive-text border-destructive/20'}`}>
                                        {testResults[evolution.id].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                        {testResults[evolution.id].ok ? 'Conexão ativa!' : testResults[evolution.id].message || 'Falha técnica.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Integrações">{page}</ConfigLayout>
    </AppLayout>
);
