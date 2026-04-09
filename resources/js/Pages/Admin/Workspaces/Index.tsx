import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, Building2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const statusColors: Record<string, string> = {
    active:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    overdue:  'bg-red-500/20 text-red-400 border-red-500/30',
    canceled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    none:     'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
};

const statusLabel: Record<string, string> = {
    active: 'Ativo', trialing: 'Trial', overdue: 'Vencido', canceled: 'Cancelado', none: '—',
};

interface Workspace {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    users_count: number;
    customers_count: number;
    plan: string;
    status: string;
    ends_at: string | null;
    trial_ends_at: string | null;
}

interface Props {
    workspaces: {
        data: Workspace[];
        meta: { current_page: number; last_page: number; total: number; per_page: number };
        links: { prev: string | null; next: string | null };
    };
    filters: { search: string | null };
}

export default function WorkspacesIndex({ workspaces, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/workspaces', { search }, { preserveState: true });
    };

    return (
        <AdminLayout title="Workspaces">
            <Head title="Control Plane — Workspaces" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Workspaces</h1>
                        <p className="text-zinc-500 text-sm mt-1">{workspaces.meta.total} workspaces cadastrados</p>
                    </div>
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou slug..."
                            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl pl-9 pr-4 py-2.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-violet-600"
                        />
                    </form>
                </div>

                {/* Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Workspace</th>
                                <th className="text-left px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Plano</th>
                                <th className="text-left px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Vencimento</th>
                                <th className="text-left px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Usuários</th>
                                <th className="text-left px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Cadastro</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {workspaces.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        Nenhum workspace encontrado.
                                    </td>
                                </tr>
                            )}
                            {workspaces.data.map(w => (
                                <tr key={w.id} className="hover:bg-zinc-800/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-white">{w.name}</p>
                                        <p className="text-zinc-600 text-xs">{w.slug}</p>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400">{w.plan}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[w.status] ?? statusColors.none}`}>
                                            {statusLabel[w.status] ?? w.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                        {w.status === 'trialing' ? w.trial_ends_at : w.ends_at ?? '—'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs">{w.users_count}</td>
                                    <td className="px-6 py-4 text-zinc-500 text-xs">{w.created_at}</td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/workspaces/${w.id}`}
                                            className="flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Detalhe <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {workspaces.meta.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-zinc-500 text-xs">
                            Página {workspaces.meta.current_page} de {workspaces.meta.last_page}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.get('/admin/workspaces', { search, page: workspaces.meta.current_page - 1 })}
                                disabled={workspaces.meta.current_page === 1}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs flex items-center gap-1"
                            >
                                <ChevronLeft className="w-3 h-3" /> Anterior
                            </button>
                            <button
                                onClick={() => router.get('/admin/workspaces', { search, page: workspaces.meta.current_page + 1 })}
                                disabled={workspaces.meta.current_page === workspaces.meta.last_page}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs flex items-center gap-1"
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
