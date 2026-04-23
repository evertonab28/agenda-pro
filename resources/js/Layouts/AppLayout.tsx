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
import { useAppearance } from '@/Hooks/useAppearance';

export default function AppLayout({ children }: { children: ReactNode }) {
  useAppearance(); // Gerencia a aplicação do tema globalmente
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      {!props.auth.hide_nav && (
        <aside className="w-full md:w-64 border-r bg-sidebar border-border">
          <div className="h-16 flex items-center px-6 border-b border-border font-bold text-xl text-primary">
            AgendaNexo
          </div>
          <nav className="p-4 space-y-1">
            <Link 
              href={route('dashboard')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/dashboard') && !isCurrent('/dashboard/executivo')
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Geral
            </Link>
            <Link 
              href={route('dashboard.executive')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/dashboard/executivo') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <TrendingUp className="w-5 h-5 text-primary/70" />
              BI Executivo
            </Link>
            <Link 
              href={route('agenda')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/agenda') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Agenda
            </Link>
            <Link 
              href={route('customers.index')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/customers') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Users className="w-5 h-5" />
              Clientes
            </Link>
            <Link 
              href={route('waitlist.index')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/lista-espera') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Users className="w-5 h-5 opacity-70" />
              Lista de Espera
            </Link>
            <Link 
              href={route('packages.index')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/pacotes') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Package className="w-5 h-5" />
              Pacotes
            </Link>
            <Link 
              href={route('finance.dashboard')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                url === '/financeiro' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Banknote className="w-5 h-5" />
              Financeiro
            </Link>
            <Link 
              href={route('finance.charges.index')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/financeiro/cobrancas') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Banknote className="w-5 h-5 opacity-50" />
              Gestão de Cobranças
            </Link>
            <Link 
              href={route('crm.index')} 
              prefetch
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                isCurrent('/crm') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Users className="w-5 h-5 opacity-50" />
              CRM & Retenção
            </Link>
            {props.auth.can.manage_users && (
              <Link 
                href={route('users.index')} 
                prefetch
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                  isCurrent('/usuarios') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Users className="w-5 h-5" />
                Usuários
              </Link>
            )}
            {props.auth.can.manage_settings && (
              <Link 
                href={route('configuracoes.general.index')} 
                prefetch
                className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                  url.startsWith('/configuracoes') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="font-medium text-foreground">Visão Geral</div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                U
              </div>
              <Link 
                href={route('logout')} 
                method="post" 
                as="button" 
                className="p-1.5 rounded-lg text-muted-foreground cursor-pointer hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </header>
        )}

        <main className={`flex-1 overflow-auto p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden relative ${props.auth.hide_nav ? 'flex items-center justify-center bg-background' : ''}`}>
          {props.auth.hide_nav ? (
            <div className="w-full max-w-4xl bg-card shadow-2xl rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
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
                    <Link href={route('onboarding.index')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
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
              ? 'bg-success-bg border-success/20 text-success-text' 
              : 'bg-error-bg border-error/20 text-error-text'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-error" />
            )}
            <p className="text-sm font-bold pr-4">{message.text}</p>
            <button onClick={() => setVisible(false)} className="p-1 hover:bg-foreground/5 rounded-full transition-colors">
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        </div>
      )}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
