import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
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
import { route } from '@/utils/route';
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
    const [testResults, setTestResults] = useState<Record<number, { ok: boolean, message?: string }>>({});

    // Encontrar integrações existentes ou fakes iniciais
    const asaas = integrations.find(i => i.provider === 'asaas');
    const evolution = integrations.find(i => i.provider === 'evolution');

    const asaasForm = useForm({
        type: 'payment',
        provider: 'asaas',
        credentials: {
            api_key: asaas?.credentials?.api_key === '********' ? '' : '',
        }
    });

    const evolutionForm = useForm({
        type: 'messaging',
        provider: 'evolution',
        credentials: {
            api_key: evolution?.credentials?.api_key === '********' ? '' : '',
            instance_name: evolution?.credentials?.instance_name === '********' ? '' : '',
            base_url: evolution?.credentials?.base_url === '********' ? '' : '',
        }
    });

    const handleSave = (form: any) => {
        form.post(route('api.workspace-integrations.store'), {
            preserveScroll: true,
            onSuccess: () => {
                // Notificar sucesso (Inertia Flash costuma lidar com isso)
            }
        });
    };

    const testConnection = async (integrationId: number) => {
        setTestingId(integrationId);
        try {
            const response = await axios.post(`/api/workspace-integrations/${integrationId}/test-connection`);
            setTestResults(prev => ({ ...prev, [integrationId]: { ok: true } }));
        } catch (error: any) {
            setTestResults(prev => ({ 
                ...prev, 
                [integrationId]: { 
                    ok: false, 
                    message: error.response?.data?.message || 'Falha na conexão' 
                } 
            }));
        } finally {
            setTestingId(null);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            pending: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-400'
        };

        const config = {
            active: { label: 'Ativo', icon: CheckCircle2 },
            error: { label: 'Erro', icon: XCircle },
            pending: { label: 'Pendente', icon: AlertCircle }
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
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="asaas_api_key">API Key (Produção ou Sandbox)</Label>
                                <Input 
                                    id="asaas_api_key"
                                    type="password"
                                    placeholder={asaas ? 'Manter chave existente' : 'Insira sua chave do Asaas'}
                                    value={asaasForm.data.credentials.api_key}
                                    onChange={e => asaasForm.setData('credentials', { ...asaasForm.data.credentials, api_key: e.target.value })}
                                />
                                {asaasForm.errors['credentials.api_key'] && (
                                    <p className="text-xs text-red-500">{asaasForm.errors['credentials.api_key']}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button 
                                className="flex-1" 
                                onClick={() => handleSave(asaasForm)}
                                disabled={asaasForm.processing}
                            >
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

                        {testResults[asaas?.id || 0] && (
                            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${
                                testResults[asaas!.id].ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10' : 'bg-red-50 text-red-700 dark:bg-red-900/10'
                            }`}>
                                {testResults[asaas!.id].ok ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {testResults[asaas!.id].ok ? 'Conexão estabelecida com sucesso!' : testResults[asaas!.id].message}
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
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">WhatsApp</h3>
                                <p className="text-xs text-gray-500">Evolution API</p>
                            </div>
                        </div>
                        {evolution && <StatusBadge status={evolution.status} />}
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="evo_url">URL da API</Label>
                                <Input 
                                    id="evo_url"
                                    placeholder="https://api.seuservidor.com"
                                    value={evolutionForm.data.credentials.base_url}
                                    onChange={e => evolutionForm.setData('credentials', { ...evolutionForm.data.credentials, base_url: e.target.value })}
                                />
                                {evolutionForm.errors['credentials.base_url'] && (
                                    <p className="text-xs text-red-500">{evolutionForm.errors['credentials.base_url']}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="evo_instance">Nome da Instância</Label>
                                <Input 
                                    id="evo_instance"
                                    placeholder="ex: agendapro_01"
                                    value={evolutionForm.data.credentials.instance_name}
                                    onChange={e => evolutionForm.setData('credentials', { ...evolutionForm.data.credentials, instance_name: e.target.value })}
                                />
                                {evolutionForm.errors['credentials.instance_name'] && (
                                    <p className="text-xs text-red-500">{evolutionForm.errors['credentials.instance_name']}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="evo_key">API Global Key</Label>
                                <Input 
                                    id="evo_key"
                                    type="password"
                                    placeholder={evolution ? 'Manter chave existente' : 'Insira o Global Token'}
                                    value={evolutionForm.data.credentials.api_key}
                                    onChange={e => evolutionForm.setData('credentials', { ...evolutionForm.data.credentials, api_key: e.target.value })}
                                />
                                {evolutionForm.errors['credentials.api_key'] && (
                                    <p className="text-xs text-red-500">{evolutionForm.errors['credentials.api_key']}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                                onClick={() => handleSave(evolutionForm)}
                                disabled={evolutionForm.processing}
                            >
                                {evolution ? 'Atualizar' : 'Configurar'}
                            </Button>
                            
                            {evolution && (
                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => testConnection(evolution.id)}
                                    disabled={testingId === evolution.id}
                                    title="Testar Conexão"
                                >
                                    {testingId === evolution.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 text-gray-400" />
                                    )}
                                </Button>
                            )}
                        </div>

                        {testResults[evolution?.id || 0] && (
                            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${
                                testResults[evolution!.id].ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10' : 'bg-red-50 text-red-700 dark:bg-red-900/10'
                            }`}>
                                {testResults[evolution!.id].ok ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {testResults[evolution!.id].ok ? 'WhatsApp conectado!' : testResults[evolution!.id].message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ConfigLayout>
    );
}
