import { ReactNode } from 'react';
import { 
    LayoutDashboard, 
    Calendar, 
    Users, 
    Settings, 
    LogOut,
    Plus,
    Search,
    Bell,
    CreditCard,
    DollarSign,
    PiggyBank,
    Banknote
} from 'lucide-react';
import { route } from '@/utils/route';
import { Link, usePage } from '@inertiajs/react';


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
            href={route('dashboard')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCurrent('/dashboard') 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            href={route('agenda')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCurrent('/agenda') 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Agenda
          </Link>
          <Link 
            href={route('customers.index')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCurrent('/customers') 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="w-5 h-5" />
            Clientes
          </Link>
          <Link 
            href={route('finance.dashboard')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              url === '/financeiro' 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Banknote className="w-5 h-5" />
            Financeiro
          </Link>
          <Link 
            href={route('finance.charges.index')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCurrent('/financeiro/cobrancas') 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Banknote className="w-5 h-5 opacity-50" />
            Gestão de Cobranças
          </Link>
          <Link 
            href={route('configuracoes.services.index')} 
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              isCurrent('/configuracoes') 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </Link>
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
