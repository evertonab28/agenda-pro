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
    TrendingUp,
    ShieldCheck,
    Receipt
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
import AppLayout from '@/Layouts/AppLayout';
import { SectionCard } from '@/components/Shared/SectionCard';
import { StatusPill } from '@/components/Shared/StatusPill';

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

export default function Index({ subscription, stats, invoices, availablePlans }: Props) {
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
    const { processing } = useForm();

    if (!subscription) {
        return (
            <>
                <Head title="Assinatura - Configurações" />
                <div className="p-12 text-center bg-muted/20 rounded-3xl border border-dashed border-border/60">
                    <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4 opacity-40" />
                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Nenhuma assinatura ativa</h3>
                    <p className="text-muted-foreground font-medium mt-2">Entre em contato com o suporte para ativar sua conta.</p>
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
        if (isCanceled) return 'Reativar Plano';
        if (isTrial)    return `Assinar ${subscription.plan.name}`;
        return 'Mudar de Plano';
    };

    const UsageBar = ({ label, current, limit, icon: Icon }: any) => {
        const percent = Math.min((current / limit) * 100, 100);
        const isFull  = current >= limit;
        return (
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground border border-border/40">
                            <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{label}</span>
                    </div>
                    <div className="text-[11px] font-black tracking-tighter">
                        <span className={isFull ? 'text-destructive' : 'text-primary'}>{current}</span>
                        <span className="mx-1 text-muted-foreground opacity-40">/</span>
                        <span className="text-muted-foreground">{limit}</span>
                    </div>
                </div>
                <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden p-0.5 border border-border/20 shadow-inner">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isFull ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Faturamento - Configurações" />

            <div className="max-w-6xl space-y-6">
                {/* Alerts Section */}
                {isOverdue && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest">
                            Assinatura em atraso — Regularize seu faturamento para evitar bloqueios automáticos.
                        </div>
                    </div>
                )}

                {isTrial && (
                    <div className="p-4 bg-info-bg/10 border border-info-bg/20 text-info-text rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-10 h-10 rounded-xl bg-info-bg/20 flex items-center justify-center">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest">
                            Aproveite seu período experimental — Ative o plano definitivo para manter seus dados.
                        </div>
                    </div>
                )}

                {/* Subscription Overview */}
                <SectionCard contentClassName="p-0 overflow-hidden">
                    <div className={`p-8 flex flex-col md:flex-row gap-10 items-center justify-between relative overflow-hidden ${
                        isActive ? 'bg-primary/[0.02]' : 'bg-destructive/[0.02]'
                    }`}>
                        {/* Abstract Background Element */}
                        <Zap className="absolute -right-12 -bottom-12 w-64 h-64 opacity-[0.03] -rotate-12 text-primary" />

                        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10 text-center md:text-left">
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
                                isActive ? 'bg-primary text-white shadow-primary/20' : 'bg-destructive text-white shadow-destructive/20'
                            }`}>
                                <Zap className="w-10 h-10" />
                            </div>
                            <div>
                                <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                                    <h2 className="text-4xl font-black text-foreground tracking-tightest">
                                        Plano {subscription.plan.name}
                                    </h2>
                                    <StatusPill 
                                        label={subscription.status.toUpperCase()} 
                                        variant={isActive ? 'success' : 'destructive'} 
                                        className="h-6 px-4 text-[10px] font-black"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                                    {isTrial && `Avaliação gratuita encerra em ${new Date(subscription.trial_ends_at!).toLocaleDateString('pt-BR')}`}
                                    {!isTrial && !isCanceled && `Próxima renovação automática: ${new Date(subscription.ends_at!).toLocaleDateString('pt-BR')}`}
                                    {isCanceled && `Acesso garantido até: ${new Date(subscription.ends_at!).toLocaleDateString('pt-BR')}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                            {!isCanceled && !isOverdue && (
                                <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-2xl">
                                            Cancelar Assinatura
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl border-border/40 shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="font-black text-2xl tracking-tight text-foreground">Cancelar Plano?</DialogTitle>
                                            <DialogDescription className="font-medium text-muted-foreground pt-2">
                                                Você manterá o acesso total até o dia <span className="text-primary font-black">{subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString('pt-BR') : 'N/A'}</span>. Após esta data, o sistema entrará em modo leitura.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="mt-8 gap-3">
                                            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} className="rounded-xl h-11 px-6 font-bold">Manter Assinatura</Button>
                                            <Button variant="destructive" onClick={handleCancel} disabled={processing} className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px]">Confirmar Cancelamento</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}

                            <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3">
                                        <ArrowUpCircle className="w-5 h-5" />
                                        {mainCTALabel()}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-full !max-w-[1200px] sm:!max-w-[1200px] rounded-[2.5rem] border-border/20 shadow-2xl p-6 md:p-10">
                                    <DialogHeader className="pb-6">
                                        <DialogTitle className="text-3xl font-black tracking-tightest uppercase text-center">
                                            {isTrial ? 'Escolha sua Jornada' : 'Upgrade de Escala'}
                                        </DialogTitle>
                                        <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">
                                            Selecione o plano ideal para a fase atual do seu negócio
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                                        {availablePlans.map((plan) => {
                                            const action          = getPlanCardAction(plan);
                                            const isCurrent       = action === 'current';
                                            const isActivateCard  = action === 'activate';

                                            return (
                                                <div
                                                    key={plan.id}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all duration-500 flex flex-col relative group ${
                                                        isCurrent
                                                            ? 'border-primary bg-primary/[0.03] shadow-2xl shadow-primary/10'
                                                            : 'border-border/60 hover:border-primary/30 bg-card hover:shadow-xl'
                                                    }`}
                                                >
                                                    {isCurrent && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                                                            Plano Atual
                                                        </div>
                                                    )}
                                                    <div className="mb-6">
                                                        <h4 className="font-black text-xl text-foreground tracking-tight uppercase">{plan.name}</h4>
                                                        <div className="flex items-baseline gap-1 mt-3">
                                                            <span className="text-3xl font-black text-foreground">R$ {plan.price}</span>
                                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">/{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-3 mb-8 flex-1">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-5 flex items-center gap-2.5">
                                                            <TrendingUp className="w-4 h-4 text-primary" />
                                                            Entregas do Plano
                                                        </p>
                                                        {Object.entries(plan.features)
                                                            .filter(([_, val]) => val !== false)
                                                            .map(([key, val]) => {
                                                                let displayValue = key.replace(/_/g, ' ');
                                                                if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) {
                                                                    displayValue = `${val} ${displayValue}`;
                                                                }
                                                                return (
                                                                    <div key={key} className="flex items-start gap-3 text-xs font-bold text-foreground/70 uppercase tracking-tighter leading-tight">
                                                                        <ShieldCheck className="w-4 h-4 text-primary shrink-0 opacity-40 group-hover:opacity-100 transition-opacity mt-0.5" />
                                                                        <span>{displayValue}</span>
                                                                    </div>
                                                                );
                                                            })
                                                            .slice(0, 7)}
                                                    </div>

                                                    <Button
                                                        variant={isCurrent ? 'outline' : 'default'}
                                                        className={`w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isCurrent ? 'border-primary text-primary hover:bg-primary/5' : 'bg-primary shadow-lg shadow-primary/20'}`}
                                                        disabled={isCurrent || processing}
                                                        onClick={() => {
                                                            if (isCurrent || processing) return;
                                                            if (isActivateCard) handleActivate(plan.id);
                                                            else handleUpgrade(plan.id);
                                                        }}
                                                    >
                                                        {isActivateCard && `Assinar Plano`}
                                                        {isCurrent  && 'Você está aqui'}
                                                        {action === 'select'   && 'Migrar Agora'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </SectionCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Subscription Usage */}
                    <SectionCard 
                        title="Metricas de Escala" 
                        subtitle="Acompanhe o consumo de recursos permitidos no seu plano."
                    >
                        <div className="space-y-10 py-2">
                            <UsageBar label="Equipe de Especialistas" current={stats.professionals.current} limit={stats.professionals.limit} icon={HardHat} />
                            <UsageBar label="Contas de Operadores" current={stats.users.current} limit={stats.users.limit} icon={Users} />
                        </div>
                    </SectionCard>

                    {/* Active Features */}
                    <SectionCard 
                        title="Inteligência Ativa" 
                        subtitle="Módulos e recursos desbloqueados na sua assinatura."
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(subscription.plan.features).map(([key, value]) => {
                                if (typeof value !== 'boolean') return null;
                                return (
                                    <div key={key} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${value ? 'bg-muted/20 border-border/40' : 'opacity-30 grayscale border-dashed'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none">
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                </div>

                {/* Billing History */}
                <SectionCard 
                    title="Histórico Transacional" 
                    subtitle="Relatório completo de faturas, períodos de referência e status de pagamento."
                    noPadding
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/40">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ciclo / Referência</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Produto</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Montante</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Vencimento</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Documento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 bg-card">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Receipt className="w-12 h-12" />
                                                <p className="text-sm font-black uppercase tracking-widest">Nenhuma movimentação financeira</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-6 py-5 font-black text-foreground text-sm tracking-tight">{invoice.reference_period}</td>
                                            <td className="px-6 py-5 text-[10px] font-bold uppercase text-muted-foreground opacity-60 tracking-wider">{invoice.plan.name}</td>
                                            <td className="px-6 py-5 font-black text-sm text-foreground text-center">R$ {invoice.amount}</td>
                                            <td className="px-6 py-5 text-[11px] font-bold text-muted-foreground">{new Date(invoice.due_date).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-5 text-center">
                                                <StatusPill 
                                                    label={invoice.status.toUpperCase()} 
                                                    variant={
                                                        invoice.status === 'paid' ? 'success' : 
                                                        invoice.status === 'overdue' ? 'destructive' : 'warning'
                                                    } 
                                                    className="font-black text-[9px]"
                                                />
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {invoice.status !== 'paid' && invoice.provider_payment_link && (
                                                    <Button
                                                        variant="outline"
                                                        className="h-10 px-6 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-black text-[9px] uppercase tracking-widest shadow-sm"
                                                        onClick={() => window.open(invoice.provider_payment_link!, '_blank')}
                                                    >
                                                        Regularizar
                                                    </Button>
                                                )}
                                                {invoice.status === 'paid' && (
                                                    <div className="flex items-center justify-end gap-2 text-success opacity-50 font-black text-[9px] uppercase tracking-widest">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Liquidada
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Faturamento & Assinatura">{page}</ConfigLayout>
    </AppLayout>
);
