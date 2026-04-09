import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Building2, ChevronRight, ChevronLeft, Filter, X } from 'lucide-react';
import { useState } from 'react';

const statusColors: Record<string, string> = {
    active:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    overdue:  'bg-red-500/20 text-red-400 border-red-500/30',
    canceled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    none:     'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
};

const statusLabel: Record<string, string> = {
    active: 'Ativo', trialing: 'Trial', overdue: 'Overdue', canceled: 'Cancelado', none: '—',
};

const invoiceStatusColors: Record<string, string> = {
    paid: 'text-emerald-400', pending: 'text-amber-400', overdue: 'text-red-400', canceled: 'text-zinc-500',
};

interface Plan { id: number; name: string; price: number; }

interface Workspace {
    id: number; name: string; slug: string; created_at: string;
    users_count: number; customers_count: number;
    plan: string; plan_price: number;
    status: string; ends_at: string | null; trial_ends_at: string | null;
    last_invoice: { status: string; amount: number; due_date: string | null } | null;
}

interface Props {
    workspaces: {
        data: Workspace[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: { search: string | null; status: string | null; plan_id: string | null };
    plans: Plan[];
}

const STATUS_TABS = [
    { value: 'all',      label: 'Todos' },
    { value: 'active',   label: 'Ativos' },
    { value: 'trialing', label: 'Trial' },
    { value: 'overdue',  label: 'Overdue' },
    { value: 'canceled', label: 'Cancelados' },
    { value: 'none',     label: 'Sem plano' },
];

export default function WorkspacesIndex({ workspaces, filters, plans }: Props) {
    const [search, setSearch]   = useState(filters.search ?? '');
    const [status, setStatus]   = useState(filters.status ?? 'all');
    const [planId, setPlanId]   = useState(filters.plan_id ?? '');

    const applyFilters = (overrides: Record<string, any> = {}) => {
        router.get('/admin/workspaces', {
            search,
            status: status !== 'all' ? status : undefined,
            plan_id: planId || undefined,
            ...overrides,
        }, { preserveState: true });
    };

    const handleStatusTab = (val: string) => {
        setStatus(val);
        applyFilters({ status: val !== 'all' ? val : undefined });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const fmt = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <AdminLayout title="Workspaces">
            <Head title="Control Plane — Workspaces" />
            <div className="space-y-5 max-w-7xl">
                {/* Header + search */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Workspaces</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">{workspaces.total} registros</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {planId && (
                            <button
                                onClick={() => { setPlanId(''); applyFilters({ plan_id: undefined }); }}
                                className="flex items-center gap-1 text-xs text-violet-400 bg-violet-600/10 border border-violet-600/20 rounded-lg px-2.5 py-1.5 hover:bg-violet-600/20"
                            >
                                <X className="w-3 h-3" /> Filtro plano
                            </button>
                        )}
                        <select
                            value={planId}
                            onChange={e => { setPlanId(e.target.value); applyFilters({ plan_id: e.target.value || undefined }); }}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-600"
                        >
                            <option value="">Todos os planos</option>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar nome ou slug..."
                                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl pl-9 pr-3 py-2 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-violet-600"
                            />
                        </form>
                    </div>
                </div>

                {/* Status tabs */}
                <div className="flex gap-1 border-b border-zinc-800 pb-1 overflow-x-auto">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => handleStatusTab(tab.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                                status === tab.value
                                    ? 'bg-violet-600/20 text-violet-400'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left px-5 py-3.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">Workspace</th>
                                <th className="text-left px-5 py-3.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">Plano / Valor</th>
                                <th className="text-left px-5 py-3.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">Vencimento</th>
                                <th className="text-left px-5 py-3.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">Última Invoice</th>
                                <th className="text-left px-5 py-3.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">Usuários</th>
                                <th className="text-left px-5 py-3.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">Cadastro</th>
                                <th className="px-5 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                            {workspaces.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-zinc-500">
                                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                        Nenhum workspace encontrado.
                                    </td>
                                </tr>
                            )}
                            {workspaces.data.map(w => (
                                <tr key={w.id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-zinc-200 group-hover:text-white">{w.name}</p>
                                        <p className="text-zinc-600 text-[11px]">{w.slug}</p>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <p className="text-zinc-300 text-sm">{w.plan}</p>
                                        {w.plan_price > 0 && <p className="text-zinc-600 text-[11px]">{fmt(w.plan_price)}/mês</p>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[w.status] ?? statusColors.none}`}>
                                            {statusLabel[w.status] ?? w.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                                        {w.status === 'trialing' ? w.trial_ends_at ?? '—' : w.ends_at ?? '—'}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {w.last_invoice ? (
                                            <div>
                                                <p className={`text-xs font-medium ${invoiceStatusColors[w.last_invoice.status] ?? 'text-zinc-400'}`}>
                                                    {fmt(w.last_invoice.amount)}
                                                </p>
                                                <p className="text-zinc-600 text-[10px]">{w.last_invoice.status} · {w.last_invoice.due_date ?? '—'}</p>
                                            </div>
                                        ) : <span className="text-zinc-700 text-xs">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-zinc-500 text-xs">{w.users_count}</td>
                                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{w.created_at}</td>
                                    <td className="px-5 py-3.5">
                                        <Link
                                            href={`/admin/workspaces/${w.id}`}
                                            className="text-violet-400 hover:text-violet-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {workspaces.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-zinc-500 text-xs">Página {workspaces.current_page} de {workspaces.last_page}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => applyFilters({ page: workspaces.current_page - 1 })}
                                disabled={workspaces.current_page === 1}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 text-xs flex items-center gap-1"
                            >
                                <ChevronLeft className="w-3 h-3" /> Anterior
                            </button>
                            <button
                                onClick={() => applyFilters({ page: workspaces.current_page + 1 })}
                                disabled={workspaces.current_page === workspaces.last_page}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 text-xs flex items-center gap-1"
                            >
                                Próxima <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
