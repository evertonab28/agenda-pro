import { ReactNode } from 'react';
import { Home, Calendar, Users, Settings, LogOut } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';

// Simple route helper for Ziggy-less environments
const routeHelper = (name: string) => {
  const routes: any = {
    'dashboard': '/dashboard',
    'agenda': '/agenda',
  };
  return routes[name] || '#';
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { url } = usePage();
  const isCurrent = (path: string) => url.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800 font-bold text-xl text-primary">
          Agenda Pro
        </div>
        <nav className="p-4 space-y-1">
          <Link 
            href={routeHelper('dashboard')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCurrent('/dashboard') 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            href={routeHelper('agenda')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCurrent('/agenda') 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Agenda
          </Link>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-md font-medium">
            <Users className="w-5 h-5" />
            Clientes
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-md font-medium">
            <Settings className="w-5 h-5" />
            Configurações
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6">
          <div className="font-medium text-gray-800 dark:text-gray-200">Visão Geral</div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              U
            </div>
            <LogOut className="w-5 h-5 text-gray-500 cursor-pointer hover:text-red-500" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
