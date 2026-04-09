import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Building2, TrendingUp, AlertTriangle, Clock, DollarSign,
    CheckCircle2, XCircle, Activity, ArrowRight, Ban,
    CreditCard, BarChart3, Zap, Info
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Stats {
    total_workspaces: number;
    active_count: number;
    trialing_count: number;
    overdue_count: number;
    canceled_count: number;
    without_subscription: number;
    mrr: number;
    mrr_projected: number;
    arr: number;
    revenue_mtd: number;
    pending_invoices_count: number;
    pending_invoices_value: number;
    overdue_invoices_count: number;
    overdue_invoices_value: number;
    trial_conversion_rate: number | null;
    churn_count: number;
}

interface Alert {
    level: 'danger' | 'warning' | 'info';
    type: string;
    message: string;
    count: number;
    value: number | null;
}

interface AtRisk {
    workspace_id: number;
    workspace_name: string;
    workspace_slug: string;
    risk: 'overdue' | 'trial_expiring';
    plan: string;
    amount_at_risk: number;
    since: string;
}

interface RecentEvent {
    id: number;
    workspace_id: number;
    workspace_name: string;
    event_type: string;
    payload: Record<string, any>;
    created_at: string;
}

interface TrialMetrics {
    expiring_soon: Array<{
        workspace_id: number;
        workspace_name: string;
        trial_ends_at: string;
        days_left: number;
    }>;
    expired_trials: number;
}

interface RevenueMovements {
    period: string;
    net_movement: number;
    movements: {
        new_mrr: number;
        expansion_mrr: number;
        contraction_mrr: number;
        churned_mrr: number;
        recovered_mrr: number;
    };
}

interface RecentCancellation {
    workspace_id: number;
    workspace_name: string;
    canceled_at: string;
    category: string;
    reason: string | null;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const alertBg: Record<string, string> = {
    danger:  'border-red-800/60 bg-red-950/30',
    warning: 'border-amber-800/60 bg-amber-950/30',
    info:    'border-blue-800/60 bg-blue-950/30',
};
const alertText: Record<string, string> = {
    danger: 'text-red-400', warning: 'text-amber-400', info: 'text-blue-400',
};
const AlertIcon: Record<string, any> = {
    danger: XCircle, warning: AlertTriangle, info: Info,
};

const eventColorMap: Record<string, string> = {
    trial_started:            'text-blue-400',
    trial_expired:            'text-amber-400',
    subscription_activated:   'text-emerald-400',
    subscription_overdue:     'text-red-400',
    subscription_canceled:    'text-zinc-400',
    subscription_reactivated: 'text-blue-400',
    invoice_generated:        'text-amber-400',
    invoice_paid:             'text-emerald-400',
    invoice_overdue:          'text-red-400',
    plan_changed:             'text-violet-400',
    plan_upgrade_requested:   'text-violet-400',
    plan_upgraded:            'text-emerald-400',
};

const eventHuman: Record<string, string> = {
    trial_started:            'Trial iniciado',
    trial_expired:            'Trial expirado',
    subscription_activated:   'Assinatura ativada',
    subscription_overdue:     'Inadimplência',
    subscription_canceled:    'Cancelamento',
    subscription_reactivated: 'Reativação',
    invoice_generated:        'Fatura gerada',
    invoice_paid:             'Fatura paga',
    invoice_overdue:          'Fatura vencida',
    plan_changed:             'Troca de plano',
    plan_upgrade_requested:   'Upgrade solicitado',
    plan_upgraded:            'Upgrade concluído',
};

/* ─── Component ───────────────────────────────────────────────────────── */
export default function Dashboard({
    stats, alerts, at_risk, trial_metrics, recent_events, revenue_movements, recent_cancellations
}: {
    stats: Stats;
    alerts: Alert[];
    at_risk: AtRisk[];
    trial_metrics: TrialMetrics;
    recent_events: RecentEvent[];
    revenue_movements: RevenueMovements;
    recent_cancellations: RecentCancellation[];
}) {
    return (
        <AdminLayout title="Dashboard SaaS">
            <Head title="Control Plane — Dashboard" />
            <div className="space-y-8 max-w-7xl">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Visão Geral do SaaS</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Métricas consolidadas · todos os workspaces</p>
                    </div>
                    <div className="text-xs text-zinc-600">{new Date().toLocaleString('pt-BR')}</div>
                </div>

                {/* Alertas operacionais */}
                {alerts.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">⚡ Alertas Operacionais</p>
                        <div className="grid gap-2">
                            {alerts.map((a, i) => {
                                const Icon = AlertIcon[a.level] ?? Info;
                                return (
                                    <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${alertBg[a.level]}`}>
                                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alertText[a.level]}`} />
                                        <p className={`text-sm ${alertText[a.level]}`}>{a.message}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* KPIs de workspace */}
                <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Workspaces</p>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <KpiCard label="Total" value={stats.total_workspaces} icon={Building2} iconColor="text-violet-400" iconBg="bg-violet-600/10" />
                        <KpiCard label="Ativos" value={stats.active_count} icon={CheckCircle2} iconColor="text-emerald-400" iconBg="bg-emerald-600/10" />
                        <KpiCard label="Em Trial" value={stats.trialing_count} icon={Clock} iconColor="text-blue-400" iconBg="bg-blue-600/10" />
                        <KpiCard label="Inadimplentes" value={stats.overdue_count} icon={AlertTriangle} iconColor="text-red-400" iconBg="bg-red-600/10" />
                        <KpiCard label="Cancelados" value={stats.canceled_count} icon={Ban} iconColor="text-zinc-400" iconBg="bg-zinc-600/10" />
                    </div>
                </div>

                {/* KPIs financeiros */}
                <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Financeiro</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <FinCard label="MRR (ativo)" value={fmt(stats.mrr)} sub="Planos ativos" accent="text-emerald-400" icon={TrendingUp} />
                        <FinCard label="ARR Estimado" value={fmt(stats.arr)} sub="MRR × 12" accent="text-violet-400" icon={BarChart3} />
                        <FinCard label="Invoices Pendentes" value={fmt(stats.pending_invoices_value)} sub={`${stats.pending_invoices_count} doc(s)`} accent="text-amber-400" icon={CreditCard} />
                        <FinCard label="Invoices Vencidas" value={fmt(stats.overdue_invoices_value)} sub={`${stats.overdue_invoices_count} doc(s)`} accent="text-red-400" icon={XCircle} />
                    </div>
                </div>

                {/* Métricas de conversão */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-500 text-xs mb-1">Taxa de Conversão (Trial → Ativo)</p>
                        <p className="text-2xl font-bold text-white">
                            {stats.trial_conversion_rate !== null ? `${stats.trial_conversion_rate}%` : '—'}
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                            {stats.trial_conversion_rate === null
                                ? 'Dados insuficientes para calcular'
                                : 'Estimativa com dados atuais'}
                        </p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-500 text-xs mb-1">Motivos de Churn / Retenção</p>
                        <p className="text-2xl font-bold text-white">{stats.churn_count}</p>
                        <p className="text-zinc-600 text-xs mt-1">Cancellations históricos totais no sistema</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-zinc-500 text-xs mb-1">MRR Projetado (c/ trials)</p>
                        <p className="text-2xl font-bold text-blue-400">{fmt(stats.mrr_projected)}</p>
                        <p className="text-zinc-600 text-xs mt-1">Se todos os trials converterem</p>
                    </div>
                </div>

                {/* Revenue Movements */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Movimentação de MRR</p>
                            <span className="text-[10px] text-zinc-600 italic hidden md:inline-block">
                                * Dados calculados de forma incremental a partir de Abr/2026
                            </span>
                        </div>
                        <span className="text-xs text-zinc-600 font-medium">Período: {revenue_movements.period}</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                        <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-xl p-4 lg:col-span-2">
                            <p className="text-emerald-500/70 text-xs mb-1">Net MRR (Líquido)</p>
                            <p className={`text-xl font-bold ${revenue_movements.net_movement >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {revenue_movements.net_movement > 0 ? '+' : ''}{fmt(revenue_movements.net_movement)}
                            </p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">New</p>
                            <p className="text-emerald-400 font-semibold">{fmt(revenue_movements.movements.new_mrr)}</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Expansion</p>
                            <p className="text-emerald-400 font-semibold">{fmt(revenue_movements.movements.expansion_mrr)}</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Contraction</p>
                            <p className="text-red-400 font-semibold">{fmt(revenue_movements.movements.contraction_mrr)}</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Churn / Lost</p>
                            <p className="text-red-400 font-semibold">{fmt(revenue_movements.movements.churned_mrr)}</p>
                        </div>
                    </div>
                </div>

                {/* Cancelamentos Recentes */}
                {recent_cancellations.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <Ban className="w-4 h-4 text-zinc-500" />
                            <h3 className="text-sm font-semibold text-white">Últimos Cancelamentos</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left px-5 py-2.5 text-zinc-500 text-xs font-medium">Workspace</th>
                                        <th className="text-left px-5 py-2.5 text-zinc-500 text-xs font-medium">Data</th>
                                        <th className="text-left px-5 py-2.5 text-zinc-500 text-xs font-medium">Categoria</th>
                                        <th className="text-left px-5 py-2.5 text-zinc-500 text-xs font-medium">Detalhe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {recent_cancellations.map(c => (
                                        <tr key={c.workspace_id} className="hover:bg-zinc-800/40">
                                            <td className="px-5 py-2.5">
                                                <Link href={`/admin/workspaces/${c.workspace_id}`} className="text-zinc-300 hover:text-violet-400">
                                                    {c.workspace_name}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-2.5 text-zinc-400 text-xs">{c.canceled_at}</td>
                                            <td className="px-5 py-2.5 text-zinc-300 text-xs">{c.category}</td>
                                            <td className="px-5 py-2.5 text-zinc-500 text-xs max-w-xs truncate">{c.reason || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Workspaces em risco + Trials expirando */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* At risk */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <h3 className="text-sm font-semibold text-white">Workspaces em Risco</h3>
                            <span className="ml-auto text-xs text-zinc-600">{at_risk.length} workspace(s)</span>
                        </div>
                        {at_risk.length === 0 ? (
                            <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-700" />
                                Nenhum workspace em risco
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-800">
                                {at_risk.map(w => (
                                    <li key={`${w.workspace_id}-${w.risk}`}>
                                        <Link href={`/admin/workspaces/${w.workspace_id}`} className="flex items-center px-5 py-3 hover:bg-zinc-800/50 transition-colors group">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-zinc-200 text-sm font-medium group-hover:text-white truncate">{w.workspace_name}</p>
                                                <p className="text-zinc-600 text-xs">{w.plan} · {w.risk === 'overdue' ? `venceu ${w.since}` : `trial até ${w.since}`}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ml-3 flex-shrink-0 ${
                                                w.risk === 'overdue'
                                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                            }`}>
                                                {w.risk === 'overdue' ? 'Overdue' : 'Trial'}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Eventos recentes */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-violet-400" />
                            <h3 className="text-sm font-semibold text-white">Eventos Comerciais Recentes</h3>
                        </div>
                        {recent_events.length === 0 ? (
                            <div className="px-5 py-8 text-center text-zinc-600 text-sm">Nenhum evento registrado ainda.</div>
                        ) : (
                            <ul className="divide-y divide-zinc-800 max-h-72 overflow-y-auto">
                                {recent_events.map(ev => (
                                    <li key={ev.id} className="px-5 py-3 flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${eventColorMap[ev.event_type] ? eventColorMap[ev.event_type].replace('text-','bg-') : 'bg-zinc-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-zinc-300 text-xs font-medium truncate">
                                                <Link href={`/admin/workspaces/${ev.workspace_id}`} className="hover:text-violet-400">
                                                    {ev.workspace_name}
                                                </Link>
                                                {' '}· {eventHuman[ev.event_type] ?? ev.event_type}
                                            </p>
                                            <p className="text-zinc-600 text-[10px]">{ev.created_at}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Trials expirando em breve */}
                {trial_metrics.expiring_soon.length > 0 && (
                    <div className="bg-zinc-900 border border-blue-900/30 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-semibold text-blue-400">Trials Expirando em até 7 dias</h3>
                            <Link href="/admin/workspaces?status=trialing" className="ml-auto text-xs text-violet-400 hover:underline flex items-center gap-1">
                                Ver todos <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left px-5 py-2.5 text-zinc-500 text-xs font-medium">Workspace</th>
                                        <th className="text-left px-5 py-2.5 text-zinc-500 text-xs font-medium">Expira em</th>
                                        <th className="text-left px-5 py-2.5 text-zinc-500 text-xs font-medium">Dias restantes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {trial_metrics.expiring_soon.map(t => (
                                        <tr key={t.workspace_id} className="hover:bg-zinc-800/40">
                                            <td className="px-5 py-2.5">
                                                <Link href={`/admin/workspaces/${t.workspace_id}`} className="text-zinc-300 hover:text-violet-400">
                                                    {t.workspace_name}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-2.5 text-zinc-400 text-xs">{t.trial_ends_at}</td>
                                            <td className="px-5 py-2.5">
                                                <span className={`text-xs font-bold ${t.days_left <= 2 ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {t.days_left}d
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, iconColor, iconBg }: any) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2.5`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
        </div>
    );
}

function FinCard({ label, value, sub, accent, icon: Icon }: any) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${accent}`} />
                <p className="text-zinc-500 text-xs">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            <p className="text-zinc-600 text-xs mt-1">{sub}</p>
        </div>
    );
}
