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
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import axios from 'axios';

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

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            pending: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-400',
        };

        const config = {
            active: { label: 'Ativo', icon: CheckCircle2 },
            error: { label: 'Erro', icon: XCircle },
            pending: { label: 'Pendente', icon: AlertCircle },
        };

        const { label, icon: Icon } = config[status as keyof typeof config] || config.pending;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
            </span>
        );
    };

    return (
        <ConfigLayout title="Integrações">
            <Head title="Integrações - Configurações" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
                {/* ASAAS CARD */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Asaas</h3>
                                <p className="text-xs text-gray-500">Gateway de Pagamentos</p>
                            </div>
                        </div>
                        {asaas && <StatusBadge status={asaas.status} />}
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="asaas_api_key">API Key (Produção ou Sandbox)</Label>
                            <Input
                                id="asaas_api_key"
                                type="password"
                                placeholder={asaas ? 'Manter chave existente' : 'Insira sua chave do Asaas'}
                                value={asaasKey}
                                onChange={e => setAsaasKey(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                className="flex-1"
                                onClick={() => handleSave({ type: 'payment', provider: 'asaas', credentials: { api_key: asaasKey } }, 'asaas')}
                                disabled={savingProvider === 'asaas' || !asaasKey}
                            >
                                {savingProvider === 'asaas' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {asaas ? 'Atualizar' : 'Configurar'}
                            </Button>

                            {asaas && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => testConnection(asaas.id)}
                                    disabled={testingId === asaas.id}
                                    title="Testar Conexão"
                                >
                                    {testingId === asaas.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 text-gray-400" />
                                    )}
                                </Button>
                            )}
                        </div>

                        {saveResults['asaas'] && (
                            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${saveResults['asaas'].ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'}`}>
                                {saveResults['asaas'].ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {saveResults['asaas'].ok ? 'Configuração salva!' : saveResults['asaas'].message}
                            </div>
                        )}

                        {asaas && testResults[asaas.id] && (
                            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${testResults[asaas.id].ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'}`}>
                                {testResults[asaas.id].ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {testResults[asaas.id].ok ? 'Conexão estabelecida com sucesso!' : testResults[asaas.id].message}
                            </div>
                        )}

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <a href="https://www.asaas.com" target="_blank" className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-primary transition-colors">
                                Pegar chaves no painel do Asaas <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* EVOLUTION CARD */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="p-6 space-y-4">
                        {/* Seção WhatsApp / Evolution API */}
                        <div className="space-y-4 border rounded-xl p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">WhatsApp (Evolution API)</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Envie lembretes e receba confirmações diretamente pelo WhatsApp.
                                    </p>
                                </div>
                                {evolution && evolution.status === 'active' && (
                                    <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Passo 1 */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="evo-url" className="flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                                        URL da sua Evolution API
                                    </Label>
                                    <Input
                                        id="evo-url"
                                        placeholder="https://api.seudominio.com"
                                        value={evoUrl}
                                        onChange={(e) => setEvoUrl(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        É o endereço do servidor Evolution API que você configurou.{' '}
                                        <a
                                            href="https://doc.evolution-api.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline hover:no-underline"
                                        >
                                            O que é isso?
                                        </a>
                                    </p>
                                </div>

                                {/* Passo 2 */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="evo-instance" className="flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                                        Nome da instância
                                    </Label>
                                    <Input
                                        id="evo-instance"
                                        placeholder="minha-barbearia"
                                        value={evoInstance}
                                        onChange={(e) => setEvoInstance(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Você vê o nome da instância no painel da sua Evolution API, em "Instâncias".
                                    </p>
                                </div>

                                {/* Passo 3 */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="evo-key" className="flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                                        Chave de API
                                    </Label>
                                    <Input
                                        id="evo-key"
                                        type="password"
                                        placeholder="Sua API Key da Evolution"
                                        value={evoKey}
                                        onChange={(e) => setEvoKey(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Encontrada em Configurações &gt; API Keys no painel da Evolution API.
                                    </p>
                                </div>
                            </div>

                            {/* Feedback de save */}
                            {saveResults['evolution'] && (
                                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${saveResults['evolution'].ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'}`}>
                                    {saveResults['evolution'].ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                    {saveResults['evolution'].ok ? 'Configuração salva com sucesso.' : saveResults['evolution'].message || 'Erro ao salvar.'}
                                </div>
                            )}

                            {/* Feedback de test */}
                            {evolution && testResults[evolution.id] && (
                                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${testResults[evolution.id].ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'}`}>
                                    {testResults[evolution.id].ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                    {testResults[evolution.id].ok ? 'Conexão testada com sucesso.' : testResults[evolution.id].message || 'Falha na conexão.'}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="default"
                                    disabled={!evoUrl || !evoInstance || !evoKey || savingProvider === 'evolution'}
                                    onClick={() =>
                                        handleSave(
                                            { type: 'messaging', provider: 'evolution', credentials: { api_key: evoKey, instance_name: evoInstance, base_url: evoUrl } },
                                            'evolution',
                                        )
                                    }
                                >
                                    {savingProvider === 'evolution' ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
                                    ) : (
                                        'Salvar configuração'
                                    )}
                                </Button>
                                {evolution && (
                                    <Button
                                        variant="outline"
                                        disabled={testingId === evolution.id}
                                        onClick={() => testConnection(evolution.id)}
                                    >
                                        {testingId === evolution.id ? (
                                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Testando...</>
                                        ) : (
                                            'Testar conexão'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ConfigLayout>
    );
}
