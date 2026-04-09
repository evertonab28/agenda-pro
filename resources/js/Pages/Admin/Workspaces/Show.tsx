import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowLeft,
    Building2,
    CreditCard,
    Activity,
    Users,
    Calendar,
    ExternalLink,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
} from 'lucide-react';

const statusColors: Record<string, string> = {
    active:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    overdue:  'bg-red-500/20 text-red-400 border-red-500/30',
    canceled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    none:     'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
};

const statusLabel: Record<string, string> = {
    active: 'Ativo', trialing: 'Trial', overdue: 'Inadimplente', canceled: 'Cancelado', none: 'Sem assinatura',
};

const invoiceStatusColors: Record<string, string> = {
    paid:    'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-amber-500/20 text-amber-400',
    overdue: 'bg-red-500/20 text-red-400',
    canceled:'bg-zinc-500/20 text-zinc-400',
};

const eventIcons: Record<string, any> = {
    subscription_activated:   CheckCircle2,
    subscription_renewed:     CheckCircle2,
    subscription_reactivated: CheckCircle2,
    overdue:                  AlertTriangle,
    trial_started:            Clock,
    canceled:                 XCircle,
    invoice_generated:        CreditCard,
};

const eventColors: Record<string, string> = {
    subscription_activated:   'text-emerald-400 bg-emerald-500/10',
    subscription_renewed:     'text-emerald-400 bg-emerald-500/10',
    subscription_reactivated: 'text-blue-400 bg-blue-500/10',
    overdue:                  'text-red-400 bg-red-500/10',
    trial_started:            'text-blue-400 bg-blue-500/10',
    canceled:                 'text-zinc-400 bg-zinc-500/10',
    invoice_generated:        'text-violet-400 bg-violet-500/10',
};

const eventLabel: Record<string, string> = {
    subscription_activated:   'Assinatura ativada',
    subscription_renewed:     'Assinatura renovada',
    subscription_reactivated: 'Assinatura reativada',
    overdue:                  'Inadimplência detectada',
    trial_started:            'Período de trial iniciado',
    canceled:                 'Assinatura cancelada',
    invoice_generated:        'Fatura gerada',
};

interface Props {
    workspace: {
        id: number;
        name: string;
        slug: string;
        created_at: string;
        users_count: number;
        customers_count: number;
    };
    subscription: {
        id: number;
        status: string;
        starts_at: string | null;
        ends_at: string | null;
        trial_ends_at: string | null;
        canceled_at: string | null;
        plan: { name: string; price: number; billing_cycle: string };
    } | null;
    invoices: Array<{
        id: number;
        amount: number;
        status: string;
        due_date: string | null;
        reference_period: string;
        plan_name: string;
        provider_payment_link: string | null;
        created_at: string;
    }>;
    events: Array<{
        id: number;
        event_type: string;
        payload: Record<string, any>;
        created_at: string;
    }>;
}

export default function WorkspaceShow({ workspace, subscription, invoices, events }: Props) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <AdminLayout title={workspace.name}>
            <Head title={`Control Plane — ${workspace.name}`} />

            <div className="space-y-8">
                {/* Back + Header */}
                <div className="flex items-start gap-4">
                    <Link href="/admin/workspaces" className="mt-1 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{workspace.name}</h1>
                                <p className="text-zinc-500 text-sm">{workspace.slug} · cadastrado em {workspace.created_at}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <Users className="w-4 h-4 text-violet-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{workspace.users_count}</p>
                        <p className="text-zinc-500 text-xs">Usuários (staff)</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <Users className="w-4 h-4 text-blue-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{workspace.customers_count}</p>
                        <p className="text-zinc-500 text-xs">Clientes (portal)</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <CreditCard className="w-4 h-4 text-emerald-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{invoices.length}</p>
                        <p className="text-zinc-500 text-xs">Invoices totais</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <Activity className="w-4 h-4 text-amber-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{events.length}</p>
                        <p className="text-zinc-500 text-xs">Eventos comerciais</p>
                    </div>
                </div>

                {/* Subscription status */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" /> Assinatura
                    </h2>
                    {subscription ? (
                        <div className="flex flex-wrap gap-6">
                            <div>
                                <p className="text-zinc-500 text-xs mb-1">Status</p>
                                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${statusColors[subscription.status] ?? statusColors.none}`}>
                                    {statusLabel[subscription.status] ?? subscription.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-xs mb-1">Plano</p>
                                <p className="text-white font-medium">{subscription.plan.name}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-xs mb-1">Valor</p>
                                <p className="text-white font-medium">{formatCurrency(subscription.plan.price)} / {subscription.plan.billing_cycle}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-xs mb-1">Início</p>
                                <p className="text-zinc-300 text-sm">{subscription.starts_at ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-xs mb-1">Vencimento</p>
                                <p className="text-zinc-300 text-sm">{subscription.ends_at ?? '—'}</p>
                            </div>
                            {subscription.trial_ends_at && (
                                <div>
                                    <p className="text-zinc-500 text-xs mb-1">Fim do Trial</p>
                                    <p className="text-blue-400 text-sm">{subscription.trial_ends_at}</p>
                                </div>
                            )}
                            {subscription.canceled_at && (
                                <div>
                                    <p className="text-zinc-500 text-xs mb-1">Cancelado em</p>
                                    <p className="text-red-400 text-sm">{subscription.canceled_at}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">Nenhuma assinatura encontrada para este workspace.</p>
                    )}
                </div>

                {/* Invoices + Events in 2 cols */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Invoices */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-zinc-400" />
                            <h2 className="text-white font-semibold text-sm">Histórico de Invoices</h2>
                        </div>
                        {invoices.length === 0 ? (
                            <div className="px-6 py-8 text-center text-zinc-600 text-sm">Nenhuma invoice encontrada.</div>
                        ) : (
                            <ul className="divide-y divide-zinc-800">
                                {invoices.map(inv => (
                                    <li key={inv.id} className="px-6 py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-zinc-200 text-sm font-medium">{inv.reference_period} — {inv.plan_name}</p>
                                            <p className="text-zinc-600 text-xs">Venc: {inv.due_date ?? '—'} · criado {inv.created_at}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-white text-sm font-bold">{formatCurrency(inv.amount)}</p>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${invoiceStatusColors[inv.status] ?? ''}`}>
                                                {inv.status}
                                            </span>
                                            {inv.provider_payment_link && inv.status !== 'paid' && (
                                                <a href={inv.provider_payment_link} target="_blank" rel="noopener" className="text-violet-400 hover:text-violet-300">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Events Timeline */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-zinc-400" />
                            <h2 className="text-white font-semibold text-sm">Histórico Comercial</h2>
                        </div>
                        {events.length === 0 ? (
                            <div className="px-6 py-8 text-center text-zinc-600 text-sm">Nenhum evento registrado.</div>
                        ) : (
                            <ul className="divide-y divide-zinc-800">
                                {events.map(ev => {
                                    const Icon = eventIcons[ev.event_type] ?? Activity;
                                    const color = eventColors[ev.event_type] ?? 'text-zinc-400 bg-zinc-500/10';
                                    return (
                                        <li key={ev.id} className="px-6 py-3 flex items-start gap-3">
                                            <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-zinc-200 text-sm">{eventLabel[ev.event_type] ?? ev.event_type}</p>
                                                <p className="text-zinc-600 text-xs">{ev.created_at}</p>
                                                {ev.payload && Object.keys(ev.payload).length > 0 && (
                                                    <div className="mt-1 text-xs text-zinc-600 font-mono truncate">
                                                        {JSON.stringify(ev.payload)}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
