import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  User,
  CreditCard,
  TrendingUp,
  Package,
  Banknote,
  SearchIcon,
  HelpCircle,
  CheckCircle2,
  XCircle,
  PiggyBank,
  DollarSign
} from 'lucide-react';
import { route } from '@/utils/route';
import { Link, usePage } from '@inertiajs/react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { url, props } = usePage<any>();
  const isCurrent = (path: string) => url.startsWith(path);
  const flash = props.flash || {};

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (flash.success) {
      setMessage({ text: flash.success, type: 'success' });
      setVisible(true);
    } else if (flash.error) {
      setMessage({ text: flash.error, type: 'error' });
      setVisible(true);
    }
  }, [flash]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row dark:bg-zinc-950">
      {/* Sidebar */}
      {!props.auth.hide_nav && (
        <aside className="w-full md:w-64 border-r bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800 font-bold text-xl text-primary">
            AgendaNexo
          </div>
          <nav className="p-4 space-y-1">
            <Link 
              href={route('dashboard')} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/dashboard') && !isCurrent('/dashboard/executivo')
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Geral
            </Link>
            <Link 
              href={route('dashboard.executive')} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/dashboard/executivo') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
              }`}
            >
              <TrendingUp className="w-5 h-5 text-primary/70" />
              BI Executivo
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
              href={route('waitlist.index')} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/lista-espera') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
              }`}
            >
              <Users className="w-5 h-5 opacity-70" />
              Lista de Espera
            </Link>
            <Link 
              href={route('packages.index')} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/pacotes') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
              }`}
            >
              <Package className="w-5 h-5" />
              Pacotes
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
              href={route('crm.index')} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/crm') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
              }`}
            >
              <Users className="w-5 h-5 opacity-50" />
              CRM & Retenção
            </Link>
            {props.auth.can.manage_users && (
              <Link 
                href={route('users.index')} 
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                  isCurrent('/usuarios') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
                }`}
              >
                <Users className="w-5 h-5" />
                Usuários
              </Link>
            )}
            {props.auth.can.manage_settings && (
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
            )}
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {!props.auth.hide_nav && (
          <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6">
            <div className="font-medium text-gray-800 dark:text-gray-200">Visão Geral</div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                U
              </div>
              <Link 
                href={route('logout')} 
                method="post" 
                as="button" 
                className="p-1.5 rounded-lg text-gray-500 cursor-pointer hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </header>
        )}

        <main className={`flex-1 overflow-auto p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden relative page-fade-in ${props.auth.hide_nav ? 'flex items-center justify-center bg-gray-50/50 dark:bg-zinc-950' : ''}`}>
          {props.auth.hide_nav ? (
            <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-primary italic">Onboarding</span>
                        {url.includes('/configuracoes/') && !url.includes('/geral') && (
                            <Link 
                                href={
                                    url.includes('/servicos') ? route('configuracoes.general.index') :
                                    url.includes('/profissionais') ? route('configuracoes.services.index') :
                                    url.includes('/horarios') ? route('configuracoes.professionals.index') :
                                    route('onboarding.index')
                                }
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                            >
                                <ChevronRight className="w-3 h-3 rotate-180" /> Voltar ao passo anterior
                            </Link>
                        )}
                    </div>
                    <Link href={route('onboarding.index')} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                        <X className="w-4 h-4" /> Sair e Voltar ao Painel
                    </Link>
                </div>
                <div className="max-h-[80vh] overflow-auto p-6">
                    {children}
                </div>
            </div>
          ) : children}
        </main>
      </div>

      {/* Toast Notification */}
      {visible && message && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400' 
              : 'bg-red-50 border-red-100 text-red-800 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <p className="text-sm font-bold pr-4">{message.text}</p>
            <button onClick={() => setVisible(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        </div>
      )}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
