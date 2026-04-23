import React from 'react';
import { Head } from '@inertiajs/react';
import { route } from '@/utils/route';
import ConfigLayout from '../Layout';
import {
    CreditCard,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Users,
    HardHat,
    ArrowUpCircle,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm, router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Subscription {
    id: number;
    plan_id: number;
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

interface Invoice {
    id: number;
    amount: string;
    status: 'pending' | 'paid' | 'overdue' | 'canceled';
    due_date: string;
    provider_payment_link: string | null;
    reference_period: string;
    plan: { name: string };
}

interface Plan {
    id: number;
    name: string;
    price: string;
    billing_cycle: string;
    features: Record<string, any>;
}

interface Props {
    subscription: Subscription | null;
    stats: {
        professionals: { current: number; limit: number };
        users: { current: number; limit: number };
    };
    invoices: Invoice[];
    availablePlans: Plan[];
}

import AppLayout from '@/Layouts/AppLayout';

export default function Index({ subscription, stats, invoices, availablePlans }: Props) {
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
    const { processing } = useForm();

    if (!subscription) {
        return (
            <>
                <Head title="Assinatura - Configurações" />
                <div className="p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">Nenhuma assinatura encontrada</h3>
                    <p className="text-gray-500">Entre em contato com o suporte para ativar sua conta.</p>
                </div>
            </>
        );
    }

    const isTrial    = subscription.status === 'trialing';
    const isOverdue  = subscription.status === 'overdue';
    const isCanceled = subscription.status === 'canceled';
    const isActive   = ['active', 'trialing'].includes(subscription.status)
        || (isCanceled && new Date(subscription.ends_at!) > new Date());

    /** Conversão de trial → mesmo plano */
    const handleActivate = (planId: number) => {
        router.post(route('configuracoes.billing.activate'), { plan_id: planId }, {
            onSuccess: () => {
                setIsUpgradeModalOpen(false);
                toast.success('Fatura gerada! Acesse o link de pagamento para ativar sua assinatura.');
            },
            onError: () => toast.error('Erro ao gerar fatura. Tente novamente.'),
        });
    };

    /** Upgrade para plano diferente */
    const handleUpgrade = (planId: number) => {
        router.post(route('configuracoes.billing.upgrade'), { plan_id: planId }, {
            onSuccess: () => {
                setIsUpgradeModalOpen(false);
                toast.success('Fatura de upgrade gerada com sucesso!');
            },
            onError: () => toast.error('Erro ao gerar upgrade. Tente novamente.'),
        });
    };

    const handleCancel = () => {
        router.post(route('configuracoes.billing.cancel'), {}, {
            onSuccess: () => {
                setIsCancelModalOpen(false);
                toast.success('Assinatura cancelada com sucesso.');
            },
            onError: () => toast.error('Erro ao cancelar assinatura.'),
        });
    };

    /**
     * Classifica cada card de plano na modal:
     * - 'activate'  → trialing no mesmo plano: habilitado com CTA "Assinar [nome]"
     * - 'current'   → não-trialing no mesmo plano: desabilitado com badge "Atual"
     * - 'select'    → plano diferente: CTA "Selecionar"
     */
    const getPlanCardAction = (plan: Plan): 'activate' | 'current' | 'select' => {
        const isSamePlan = plan.id === subscription.plan_id;
        if (isSamePlan && isTrial)  return 'activate';
        if (isSamePlan && !isTrial) return 'current';
        return 'select';
    };

    const mainCTALabel = (): string => {
        if (isCanceled) return 'Reativar / Upgrade';
        if (isTrial)    return `Assinar plano ${subscription.plan.name}`;
        return 'Alterar Plano';
    };

    const UsageBar = ({ label, current, limit, icon: Icon }: any) => {
        const percent = Math.min((current / limit) * 100, 100);
        const isFull  = current >= limit;
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
        <>
            <Head title="Assinatura - Configurações" />

            <div className="max-w-4xl space-y-8">
                {/* Overdue Alert */}
                {isOverdue && (
                    <div className="p-4 bg-red-100 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div className="text-sm font-medium">
                            Sua assinatura está em atraso. Regularize o pagamento para evitar o bloqueio total dos recursos operacionais.
                        </div>
                    </div>
                )}

                {/* Trial info banner */}
                {isTrial && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-3">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <div className="text-sm font-medium">
                            Você está no período de teste gratuito. Ative sua assinatura para continuar usando após o trial.
                        </div>
                    </div>
                )}

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
                                {isTrial && `Período de teste gratuito até ${new Date(subscription.trial_ends_at!).toLocaleDateString()}.`}
                                {!isTrial && !isCanceled && `Assinatura ativa — renova em ${new Date(subscription.ends_at!).toLocaleDateString()}.`}
                                {isCanceled && `Cancelada — acesso até ${new Date(subscription.ends_at!).toLocaleDateString()}.`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isCanceled && !isOverdue && (
                            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                        Cancelar
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Cancelar Assinatura?</DialogTitle>
                                        <DialogDescription>
                                            Você manterá acesso a todas as funcionalidades até o final do ciclo atual (
                                            {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : 'N/A'}
                                            ). Após isso, sua conta será bloqueada.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>Manter Assinatura</Button>
                                        <Button variant="destructive" onClick={handleCancel} disabled={processing}>Confirmar Cancelamento</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}

                        <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 shadow-lg h-12 px-8">
                                    <ArrowUpCircle className="w-5 h-5" />
                                    {mainCTALabel()}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {isTrial ? 'Ativar assinatura paga' : 'Escolha seu novo plano'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {isTrial
                                            ? 'Assine o seu plano atual ou faça upgrade para um plano superior.'
                                            : 'O upgrade será aplicado imediatamente após a confirmação do pagamento.'
                                        }
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                                    {availablePlans.map((plan) => {
                                        const action          = getPlanCardAction(plan);
                                        const isDisabled      = action === 'current';
                                        const isActivateCard  = action === 'activate';

                                        return (
                                            <div
                                                key={plan.id}
                                                className={`p-4 rounded-xl border-2 transition-all ${
                                                    isDisabled
                                                        ? 'border-primary bg-primary/5 opacity-60 cursor-not-allowed'
                                                        : isActivateCard
                                                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 cursor-pointer hover:border-amber-500'
                                                            : 'border-gray-200 cursor-pointer hover:border-primary'
                                                }`}
                                                onClick={() => {
                                                    if (isDisabled || processing) return;
                                                    if (isActivateCard) handleActivate(plan.id);
                                                    else handleUpgrade(plan.id);
                                                }}
                                            >
                                                <h4 className="font-bold text-lg">{plan.name}</h4>
                                                <div className="text-2xl font-black my-2">R$ {plan.price}</div>
                                                <p className="text-xs text-gray-500 mb-4">{plan.billing_cycle}</p>
                                                <Button
                                                    variant={isDisabled ? 'outline' : 'default'}
                                                    className={`w-full ${isActivateCard ? 'bg-amber-500 hover:bg-amber-600 text-white border-0' : ''}`}
                                                    disabled={isDisabled || processing}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isDisabled || processing) return;
                                                        if (isActivateCard) handleActivate(plan.id);
                                                        else handleUpgrade(plan.id);
                                                    }}
                                                >
                                                    {action === 'activate' && `Assinar ${plan.name}`}
                                                    {action === 'current'  && 'Atual'}
                                                    {action === 'select'   && 'Selecionar'}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Usage + Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-6">
                        <h3 className="font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            Uso de Recursos
                        </h3>
                        <div className="space-y-6">
                            <UsageBar label="Profissionais" current={stats.professionals.current} limit={stats.professionals.limit} icon={HardHat} />
                            <UsageBar label="Usuários (Equipe)" current={stats.users.current} limit={stats.users.limit} icon={Users} />
                        </div>
                    </div>

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

                {/* Invoices Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                        <h3 className="font-bold flex items-center gap-2 text-lg">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            Histórico de Faturamento (SaaS)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Período</th>
                                    <th className="px-6 py-4">Plano</th>
                                    <th className="px-6 py-4">Valor</th>
                                    <th className="px-6 py-4">Vencimento</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            Nenhuma fatura encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/20">
                                            <td className="px-6 py-4 font-medium">{invoice.reference_period}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{invoice.plan.name}</td>
                                            <td className="px-6 py-4 font-bold">R$ {invoice.amount}</td>
                                            <td className="px-6 py-4">{new Date(invoice.due_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    invoice.status === 'paid'    ? 'bg-emerald-100 text-emerald-700' :
                                                    invoice.status === 'overdue' ? 'bg-red-100 text-red-700'         :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {invoice.status !== 'paid' && invoice.provider_payment_link && (
                                                    <Button
                                                        variant="link"
                                                        className="h-auto p-0 font-bold"
                                                        onClick={() => window.open(invoice.provider_payment_link!, '_blank')}
                                                    >
                                                        Pagar agora
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Faturamento e Assinatura">{page}</ConfigLayout>
    </AppLayout>
);
