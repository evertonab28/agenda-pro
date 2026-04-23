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
                    <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Nenhuma assinatura encontrada</h3>
                    <p className="text-muted-foreground">Entre em contato com o suporte para ativar sua conta.</p>
                </div>
            </>
        );
    }

    const isTrial    = subscription.status === 'trialing';
    const isOverdue  = subscription.status === 'overdue';
    const isCanceled = subscription.status === 'canceled';
    const isActive   = ['active', 'trialing'].includes(subscription.status)
        || (isCanceled && new Date(subscription.ends_at!) > new Date());

    const handleActivate = (planId: number) => {
        router.post(route('configuracoes.billing.activate'), { plan_id: planId }, {
            onSuccess: () => {
                setIsUpgradeModalOpen(false);
                toast.success('Fatura gerada! Acesse o link de pagamento para ativar sua assinatura.');
            },
            onError: () => toast.error('Erro ao gerar fatura. Tente novamente.'),
        });
    };

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
                    <div className="flex items-center gap-2 font-medium text-foreground">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {label}
                    </div>
                    <span className="text-muted-foreground">{current} / {limit}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isFull ? 'bg-destructive' : 'bg-primary'}`}
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
                    <div className="p-4 bg-destructive-bg border border-destructive/20 text-destructive-text rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <div className="text-sm font-medium">
                            Sua assinatura está em atraso. Regularize o pagamento para evitar o bloqueio total dos recursos operacionais.
                        </div>
                    </div>
                )}

                {/* Trial info banner */}
                {isTrial && (
                    <div className="p-4 bg-warning-bg border border-warning/20 text-warning-text rounded-xl flex items-center gap-3">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <div className="text-sm font-medium">
                            Você está no período de teste gratuito. Ative sua assinatura para continuar usando após o trial.
                        </div>
                    </div>
                )}

                {/* Status Card */}
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-6 items-center justify-between ${
                    isActive
                        ? 'bg-success-bg/30 border-success/20'
                        : 'bg-destructive-bg/30 border-destructive/20'
                }`}>
                    <div className="flex gap-4 items-center">
                        <div className={`p-4 rounded-xl ${isActive ? 'bg-success-bg text-success-text' : 'bg-destructive-bg text-destructive-text'}`}>
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-foreground">
                                    Plano {subscription.plan.name}
                                </h2>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    isActive ? 'bg-success-bg text-success-text border-success/20' : 'bg-destructive-bg text-destructive-text border-destructive/20'
                                }`}>
                                    {subscription.status}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
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
                                    <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
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
                                                className={`p-4 rounded-xl border-2 transition-all bg-card ${
                                                    isDisabled
                                                        ? 'border-primary bg-primary/5 opacity-60 cursor-not-allowed'
                                                        : isActivateCard
                                                            ? 'border-warning-text/40 bg-warning-bg cursor-pointer hover:border-warning-text'
                                                            : 'border-border cursor-pointer hover:border-primary'
                                                }`}
                                                onClick={() => {
                                                    if (isDisabled || processing) return;
                                                    if (isActivateCard) handleActivate(plan.id);
                                                    else handleUpgrade(plan.id);
                                                }}
                                            >
                                                <h4 className="font-bold text-lg text-foreground">{plan.name}</h4>
                                                <div className="text-2xl font-black my-2 text-foreground">R$ {plan.price}</div>
                                                <p className="text-xs text-muted-foreground mb-4">{plan.billing_cycle}</p>
                                                <Button
                                                    variant={isDisabled ? 'outline' : 'default'}
                                                    className={`w-full ${isActivateCard ? 'bg-warning text-warning-foreground hover:bg-warning/90' : ''}`}
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
                    <div className="bg-card p-6 rounded-2xl border border-border space-y-6">
                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            Uso de Recursos
                        </h3>
                        <div className="space-y-6">
                            <UsageBar label="Profissionais" current={stats.professionals.current} limit={stats.professionals.limit} icon={HardHat} />
                            <UsageBar label="Usuários (Equipe)" current={stats.users.current} limit={stats.users.limit} icon={Users} />
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
                        <h3 className="font-bold text-foreground">Incluso no seu plano:</h3>
                        <ul className="space-y-3">
                            {Object.entries(subscription.plan.features).map(([key, value]) => {
                                if (typeof value !== 'boolean') return null;
                                return (
                                    <li key={key} className={`flex items-center gap-3 text-sm ${value ? 'text-foreground' : 'text-muted-foreground/50 line-through'}`}>
                                        <CheckCircle2 className={`w-4 h-4 ${value ? 'text-success' : 'text-muted-foreground/30'}`} />
                                        {key.replace(/_/g, ' ').toUpperCase()}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold flex items-center gap-2 text-lg text-foreground">
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                            Histórico de Faturamento (SaaS)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Período</th>
                                    <th className="px-6 py-4">Plano</th>
                                    <th className="px-6 py-4">Valor</th>
                                    <th className="px-6 py-4">Vencimento</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            Nenhuma fatura encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{invoice.reference_period}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{invoice.plan.name}</td>
                                            <td className="px-6 py-4 font-bold text-foreground">R$ {invoice.amount}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{new Date(invoice.due_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                                    invoice.status === 'paid'    ? 'bg-success-bg text-success-text border-success/20' :
                                                    invoice.status === 'overdue' ? 'bg-destructive-bg text-destructive-text border-destructive/20' :
                                                    'bg-warning-bg text-warning-text border-warning/20'
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
