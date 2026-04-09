import React from 'react';
import { Head } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { 
    CreditCard, 
    CheckCircle2, 
    AlertTriangle, 
    Zap,
    Users,
    HardHat,
    ArrowUpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subscription {
    id: number;
    status: 'trialing' | 'active' | 'overdue' | 'canceled';
    trial_ends_at: string | null;
    ends_at: string | null;
    plan: {
        name: string;
        price: string;
        billing_cycle: string;
        features: Record<string, any>;
    };
}

interface Props {
    subscription: Subscription | null;
    stats: {
        professionals: { current: number, limit: number };
        users: { current: number, limit: number };
    };
}

export default function Index({ subscription, stats }: Props) {
    if (!subscription) {
        return (
            <ConfigLayout title="Assinatura">
                <div className="p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">Nenhuma assinatura encontrada</h3>
                    <p className="text-gray-500">Entre em contato com o suporte para ativar sua conta.</p>
                </div>
            </ConfigLayout>
        );
    }

    const isTrial = subscription.status === 'trialing';
    const isActive = ['active', 'trialing'].includes(subscription.status);

    const UsageBar = ({ label, current, limit, icon: Icon }: any) => {
        const percent = Math.min((current / limit) * 100, 100);
        const isFull = current >= limit;

        return (
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                        <Icon className="w-4 h-4" />
                        {label}
                    </div>
                    <span>{current} / {limit}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <ConfigLayout title="Faturamento e Assinatura">
            <Head title="Assinatura - Configurações" />

            <div className="max-w-4xl space-y-8">
                {/* Status Card */}
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-6 items-center justify-between ${
                    isActive 
                        ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' 
                        : 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'
                }`}>
                    <div className="flex gap-4 items-center">
                        <div className={`p-4 rounded-xl ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Plano {subscription.plan.name}
                                </h2>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {subscription.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isTrial 
                                    ? `Você está no período de teste gratuito até ${new Date(subscription.trial_ends_at!).toLocaleDateString()}.`
                                    : `Sua assinatura está ativa e renova em ${new Date(subscription.ends_at!).toLocaleDateString()}.`
                                }
                            </p>
                        </div>
                    </div>
                    <Button className="gap-2 shadow-lg h-12 px-8">
                        <ArrowUpCircle className="w-5 h-5" />
                        Fazer Upgrade
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Limits usage */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-6">
                        <h3 className="font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            Uso de Recursos
                        </h3>
                        <div className="space-y-6">
                            <UsageBar 
                                label="Profissionais" 
                                current={stats.professionals.current} 
                                limit={stats.professionals.limit} 
                                icon={HardHat} 
                            />
                            <UsageBar 
                                label="Usuários (Equipe)" 
                                current={stats.users.current} 
                                limit={stats.users.limit} 
                                icon={Users} 
                            />
                        </div>
                    </div>

                    {/* Features list */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-4">
                        <h3 className="font-bold">Incluso no seu plano:</h3>
                        <ul className="space-y-3">
                            {Object.entries(subscription.plan.features).map(([key, value]) => {
                                if (typeof value !== 'boolean') return null;
                                return (
                                    <li key={key} className={`flex items-center gap-3 text-sm ${value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}`}>
                                        <CheckCircle2 className={`w-4 h-4 ${value ? 'text-emerald-500' : 'text-gray-300'}`} />
                                        {key.replace(/_/g, ' ').toUpperCase()}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </ConfigLayout>
    );
}
