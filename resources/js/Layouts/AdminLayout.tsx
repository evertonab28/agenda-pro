import { ReactNode } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Building2,
    LogOut,
    Shield,
    ChevronRight,
} from 'lucide-react';

export default function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
    const { url } = usePage<any>();
    const admin = usePage<any>().props.auth?.admin;

    const isCurrent = (path: string) => url.startsWith(path);

    const handleLogout = () => {
        router.post('/admin/logout');
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar */}
            <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center gap-2 px-6 border-b border-zinc-800">
                    <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-none">Control Plane</p>
                        <p className="text-zinc-500 text-[10px]">Agenda Pro SaaS</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    <Link
                        href="/admin"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            url === '/admin'
                                ? 'bg-violet-600/20 text-violet-400'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/workspaces"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isCurrent('/admin/workspaces')
                                ? 'bg-violet-600/20 text-violet-400'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }`}
                    >
                        <Building2 className="w-4 h-4" />
                        Workspaces
                    </Link>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-zinc-800">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-400 text-xs font-bold">
                            {admin?.name?.[0] ?? 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{admin?.name ?? 'Admin'}</p>
                            <p className="text-zinc-500 text-[10px] truncate">{admin?.email ?? ''}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                            title="Sair"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-auto">
                {title && (
                    <header className="h-14 border-b border-zinc-800 flex items-center px-8 gap-2">
                        <span className="text-zinc-500 text-sm">Control Plane</span>
                        <ChevronRight className="w-3 h-3 text-zinc-700" />
                        <span className="text-white text-sm font-medium">{title}</span>
                    </header>
                )}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
