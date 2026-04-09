import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowLeft, Building2, CreditCard, Activity, Users,
    CheckCircle2, AlertTriangle, XCircle, Clock, ExternalLink, ShieldAlert, BellRing
} from 'lucide-react';
import { FormEventHandler } from 'react';

/* ─── Status/color maps ──────────────────────────────────────────────── */
const subStatusColors: Record<string, string> = {
    active:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    overdue:  'bg-red-500/20 text-red-400 border-red-500/30',
    canceled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};
const subStatusLabel: Record<string, string> = {
    active: 'Ativo', trialing: 'Trial', overdue: 'Inadimplente', canceled: 'Cancelado',
};

const invColors: Record<string, string> = {
    paid: 'bg-emerald-500/20 text-emerald-400', pending: 'bg-amber-500/20 text-amber-400',
    overdue: 'bg-red-500/20 text-red-400', canceled: 'bg-zinc-500/20 text-zinc-400',
};

const timelineConfig: Record<string, { label: string; color: string; Icon: any }> = {
    trial_started:            { label: 'Trial iniciado',       color: 'bg-blue-500/20 text-blue-400',       Icon: Clock },
    trial_expired:            { label: 'Trial expirado',       color: 'bg-amber-500/20 text-amber-400',     Icon: Clock },
    trial_ending_soon:        { label: 'Aviso fim de trial',   color: 'bg-blue-500/20 text-blue-400',       Icon: BellRing ?? Clock },
    subscription_activated:   { label: 'Assinatura ativada',   color: 'bg-emerald-500/20 text-emerald-400', Icon: CheckCircle2 },
    subscription_overdue:     { label: 'Inadimplência',        color: 'bg-red-500/20 text-red-400',         Icon: AlertTriangle },
    subscription_canceled:    { label: 'Cancelamento',         color: 'bg-zinc-500/20 text-zinc-400',       Icon: XCircle },
    subscription_reactivated: { label: 'Reativação',           color: 'bg-blue-500/20 text-blue-400',       Icon: CheckCircle2 },
    invoice_generated:        { label: 'Fatura gerada',        color: 'bg-amber-500/20 text-amber-400',     Icon: CreditCard },
    invoice_paid:             { label: 'Fatura paga',          color: 'bg-emerald-500/20 text-emerald-400', Icon: CreditCard },
    invoice_overdue:          { label: 'Fatura vencida',       color: 'bg-red-500/20 text-red-400',         Icon: CreditCard },
    reminder_sent:            { label: 'Lembrete enviado',     color: 'bg-amber-500/20 text-amber-400',     Icon: Clock },
    plan_changed:             { label: 'Troca de plano',       color: 'bg-violet-500/20 text-violet-400',   Icon: Activity },
    plan_upgrade_requested:   { label: 'Upgrade solicitado',   color: 'bg-violet-500/20 text-violet-400',   Icon: Activity },
    plan_upgraded:            { label: 'Upgrade concluído',    color: 'bg-emerald-500/20 text-emerald-400', Icon: CheckCircle2 },
    cancellation_reason_recorded: { label: 'Motivo de Churn',  color: 'bg-zinc-500/20 text-zinc-400',       Icon: ShieldAlert },
};

/* ─── Types ──────────────────────────────────────────────────────────── */
interface WorkspaceData {
    id: number; name: string; slug: string; created_at: string;
    users_count: number; customers_count: number;
}
interface SubscriptionData {
    id: number; status: string;
    starts_at: string | null; ends_at: string | null;
    trial_ends_at: string | null; canceled_at: string | null;
    cancellation_category: string | null; cancellation_reason: string | null;
    winback_candidate: boolean;
    plan: { name: string; price: number; billing_cycle: string };
}
interface InvoiceData {
    id: number; amount: number; status: string;
    due_date: string | null; paid_at: string | null;
    reference_period: string; plan_name: string;
    provider_payment_link: string | null; created_at: string;
}
interface TimelineItem {
    date: string; source: 'event' | 'invoice';
    event_type: string; payload: Record<string, any>;
    amount: number | null; status: string | null;
}

/* ─── Component ───────────────────────────────────────────────────────── */
export default function WorkspaceShow({
    workspace, subscription, invoices, timeline,
}: {
    workspace: WorkspaceData;
    subscription: SubscriptionData | null;
    invoices: InvoiceData[];
    timeline: TimelineItem[];
}) {
    const fmt = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const { data, setData, put, processing } = useForm({
        cancellation_category: subscription?.cancellation_category ?? '',
        cancellation_reason: subscription?.cancellation_reason ?? '',
        winback_candidate: subscription?.winback_candidate ?? false,
    });

    const submitRetention: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/admin/workspaces/${workspace.id}/retention`);
    };

    return (
        <AdminLayout title={workspace.name}>
            <Head title={`Control Plane — ${workspace.name}`} />
            <div className="space-y-7 max-w-6xl">

                {/* Header */}
                <div className="flex items-start gap-4">
                    <Link href="/admin/workspaces" className="mt-1 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{workspace.name}</h1>
                            <p className="text-zinc-500 text-xs">{workspace.slug} · desde {workspace.created_at}</p>
                        </div>
                        {subscription && (
                            <span className={`ml-2 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${subStatusColors[subscription.status] ?? ''}`}>
                                {subStatusLabel[subscription.status] ?? subscription.status}
                            </span>
                        )}
                        {subscription?.winback_candidate && (
                            <span className="ml-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border bg-violet-500/20 text-violet-400 border-violet-500/30">
                                Win-back Flag
                            </span>
                        )}
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                        <p className="text-zinc-500 text-xs">Invoices SaaS</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <Activity className="w-4 h-4 text-amber-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{timeline.length}</p>
                        <p className="text-zinc-500 text-xs">Eventos na timeline</p>
                    </div>
                </div>

                {/* Subscription details */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-zinc-300 mb-4">Assinatura</h2>
                    {subscription ? (
                        <div className="flex flex-wrap gap-x-8 gap-y-4">
                            {[
                                { label: 'Plano', value: subscription.plan.name },
                                { label: 'Valor', value: `${fmt(subscription.plan.price)} / ${subscription.plan.billing_cycle}` },
                                { label: 'Início', value: subscription.starts_at ?? '—' },
                                { label: 'Vencimento', value: subscription.ends_at ?? '—' },
                                subscription.trial_ends_at ? { label: 'Fim do Trial', value: subscription.trial_ends_at } : null,
                                subscription.canceled_at ? { label: 'Cancelado em', value: subscription.canceled_at } : null,
                            ].filter(Boolean).map((item: any) => (
                                <div key={item.label}>
                                    <p className="text-zinc-600 text-xs mb-0.5">{item.label}</p>
                                    <p className="text-zinc-200 text-sm font-medium">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">Sem assinatura registrada.</p>
                    )}
                </div>

                {/* Retenção e Win-back Action Block */}
                {subscription && (subscription.status === 'canceled' || subscription.status === 'overdue') && (
                    <form onSubmit={submitRetention} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <h2 className="text-sm font-semibold text-white">Retenção e Recuperação</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Motivo do Churn (Categoria)</label>
                                <select 
                                    className="w-full bg-zinc-950 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2"
                                    value={data.cancellation_category}
                                    onChange={e => setData('cancellation_category', e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Preço/Custo">Preço/Custo</option>
                                    <option value="Falta de uso">Falta de uso (Não engajou)</option>
                                    <option value="Concorrente">Migrou para concorrente</option>
                                    <option value="Faltou feature">Falta de Feature / Funcionalidade</option>
                                    <option value="Fechou as portas">Cliente fechou a empresa</option>
                                    <option value="Outro">Outro motivo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 mb-1">Detalhes (Opcional)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-950 border border-zinc-800 text-sm text-white rounded-lg px-3 py-2"
                                    placeholder="Descreva brevemente o motivo"
                                    value={data.cancellation_reason}
                                    onChange={e => setData('cancellation_reason', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-zinc-700 bg-zinc-900 bg-zinc-950 text-violet-500"
                                    checked={data.winback_candidate}
                                    onChange={e => setData('winback_candidate', e.target.checked)}
                                />
                                <span className="text-sm text-zinc-300">Marcar como candidato a <strong>Win-back</strong> (Retorno)</span>
                            </label>
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                Salvar Operação
                            </button>
                        </div>
                    </form>
                )}

                {/* Timeline + Invoices */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Timeline — 3 cols */}
                    <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-violet-400" />
                            <h2 className="text-sm font-semibold text-white">Timeline Comercial</h2>
                        </div>
                        {timeline.length === 0 ? (
                            <div className="px-5 py-10 text-center text-zinc-600 text-sm">Nenhum evento ainda.</div>
                        ) : (
                            <div className="p-5 space-y-1 max-h-[500px] overflow-y-auto">
                                {[...timeline].reverse().map((item, i) => {
                                    const cfg = timelineConfig[item.event_type] ?? {
                                        label: item.event_type, color: 'bg-zinc-500/20 text-zinc-400', Icon: Activity,
                                    };
                                    const { Icon, color, label } = cfg;
                                    return (
                                        <div key={i} className="flex items-start gap-3 py-2.5">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-zinc-200 text-sm font-medium">{label}</p>
                                                    {item.amount !== null && (
                                                        <span className="text-xs text-zinc-500">{fmt(item.amount)}</span>
                                                    )}
                                                </div>
                                                <p className="text-zinc-600 text-xs">{item.date}</p>
                                                {item.payload && Object.keys(item.payload).length > 0 && (
                                                    <div className="mt-1 text-[11px] text-zinc-600 font-mono truncate max-w-xs">
                                                        {item.payload.plan && <span>Plano: {item.payload.plan} · </span>}
                                                        {item.payload.reference_period && <span>{item.payload.reference_period}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Invoices — 2 cols */}
                    <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-zinc-400" />
                            <h2 className="text-sm font-semibold text-white">Invoices</h2>
                        </div>
                        {invoices.length === 0 ? (
                            <div className="px-5 py-10 text-center text-zinc-600 text-sm">Nenhuma invoice.</div>
                        ) : (
                            <ul className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto">
                                {invoices.map(inv => (
                                    <li key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-zinc-200 text-xs font-medium truncate">{inv.reference_period}</p>
                                            <p className="text-zinc-600 text-[10px]">{inv.plan_name} · venc {inv.due_date ?? '—'}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <p className="text-white text-xs font-bold">{fmt(inv.amount)}</p>
                                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${invColors[inv.status] ?? ''}`}>
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
                </div>
            </div>
        </AdminLayout>
    );
}
