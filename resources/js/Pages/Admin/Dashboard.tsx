import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Building2,
    TrendingUp,
    AlertTriangle,
    Clock,
    DollarSign,
    CheckCircle2,
    XCircle,
    Ban,
    ArrowRight,
} from 'lucide-react';

interface DashboardProps {
    stats: {
        total_workspaces: number;
        active: number;
        trialing: number;
        overdue: number;
        canceled: number;
        mrr: number;
        pending_invoices_value: number;
    };
    trials_expiring_soon: Array<{
        workspace_name: string;
        workspace_id: number;
        trial_ends_at: string;
        days_left: number;
    }>;
    recent_workspaces: Array<{
        id: number;
        name: string;
        slug: string;
        created_at: string;
        plan: string;
        status: string;
    }>;
    overdue_workspaces: Array<{
        workspace_name: string;
        workspace_id: number;
        ends_at: string;
    }>;
}

const statusColors: Record<string, string> = {
    active:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    overdue:  'bg-red-500/20 text-red-400 border-red-500/30',
    canceled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    none:     'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
};

const statusLabel: Record<string, string> = {
    active: 'Ativo', trialing: 'Trial', overdue: 'Vencido', canceled: 'Cancelado', none: 'Sem plano',
};

export default function Dashboard({ stats, trials_expiring_soon, recent_workspaces, overdue_workspaces }: DashboardProps) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <AdminLayout title="Dashboard">
            <Head title="Control Plane — Dashboard" />

            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white">Visão Geral do SaaS</h1>
                    <p className="text-zinc-500 text-sm mt-1">Métricas consolidadas de todos os workspaces</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Building2} label="Total Workspaces" value={stats.total_workspaces} iconColor="text-violet-400" iconBg="bg-violet-600/10" />
                    <StatCard icon={CheckCircle2} label="Ativos" value={stats.active} iconColor="text-emerald-400" iconBg="bg-emerald-600/10" />
                    <StatCard icon={Clock} label="Em Trial" value={stats.trialing} iconColor="text-blue-400" iconBg="bg-blue-600/10" />
                    <StatCard icon={AlertTriangle} label="Inadimplentes" value={stats.overdue} iconColor="text-red-400" iconBg="bg-red-600/10" />
                </div>

                {/* Financial KPIs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <p className="text-zinc-400 text-sm">MRR Estimado (mês atual)</p>
                        </div>
                        <p className="text-3xl font-bold text-white mt-3">{formatCurrency(stats.mrr)}</p>
                        <p className="text-zinc-600 text-xs mt-1">Soma de invoices pagas no mês</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 rounded-xl bg-amber-600/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-amber-400" />
                            </div>
                            <p className="text-zinc-400 text-sm">Invoices Pendentes</p>
                        </div>
                        <p className="text-3xl font-bold text-white mt-3">{formatCurrency(stats.pending_invoices_value)}</p>
                        <p className="text-zinc-600 text-xs mt-1">Invoices com status pending ou overdue</p>
                    </div>
                </div>

                {/* Alerts & Recents */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overdue */}
                    {overdue_workspaces.length > 0 && (
                        <div className="bg-zinc-900 border border-red-900/30 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <h3 className="text-sm font-semibold text-red-400">Inadimplência Ativa</h3>
                            </div>
                            <ul className="space-y-2">
                                {overdue_workspaces.map(w => (
                                    <li key={w.workspace_id}>
                                        <Link
                                            href={`/admin/workspaces/${w.workspace_id}`}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
                                        >
                                            <span className="text-zinc-300 text-sm group-hover:text-white">{w.workspace_name}</span>
                                            <span className="text-red-500 text-xs">{w.ends_at}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Trials expiring */}
                    {trials_expiring_soon.length > 0 && (
                        <div className="bg-zinc-900 border border-blue-900/30 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-semibold text-blue-400">Trials Expirando em Breve</h3>
                            </div>
                            <ul className="space-y-2">
                                {trials_expiring_soon.map(w => (
                                    <li key={w.workspace_id}>
                                        <Link
                                            href={`/admin/workspaces/${w.workspace_id}`}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
                                        >
                                            <span className="text-zinc-300 text-sm group-hover:text-white">{w.workspace_name}</span>
                                            <span className="text-blue-400 text-xs">{w.days_left}d</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recent workspaces */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-400">Workspaces Recentes</h3>
                            <Link href="/admin/workspaces" className="text-violet-400 text-xs hover:underline flex items-center gap-1">
                                Ver todos <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <ul className="space-y-2">
                            {recent_workspaces.map(w => (
                                <li key={w.id}>
                                    <Link
                                        href={`/admin/workspaces/${w.id}`}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
                                    >
                                        <div>
                                            <p className="text-zinc-300 text-sm group-hover:text-white">{w.name}</p>
                                            <p className="text-zinc-600 text-xs">{w.created_at} · {w.plan}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[w.status] ?? statusColors.none}`}>
                                            {statusLabel[w.status] ?? w.status}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ icon: Icon, label, value, iconColor, iconBg }: any) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-zinc-500 text-xs mt-1">{label}</p>
        </div>
    );
}
