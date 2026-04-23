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
          <nav className="p-4 space-y-2">
            {[
              { href: route('dashboard'), icon: LayoutDashboard, label: 'Geral', pattern: '/dashboard', exact: true },
              { href: route('dashboard.executive'), icon: TrendingUp, label: 'BI Executivo', pattern: '/dashboard/executivo' },
              { href: route('agenda'), icon: Calendar, label: 'Agenda', pattern: '/agenda' },
              { href: route('customers.index'), icon: Users, label: 'Clientes', pattern: '/customers' },
              { href: route('waitlist.index'), icon: Users, label: 'Lista de Espera', pattern: '/lista-espera', sub: true },
              { href: route('packages.index'), icon: Package, label: 'Pacotes', pattern: '/pacotes' },
              { href: route('finance.dashboard'), icon: Banknote, label: 'Financeiro', pattern: '/financeiro', exact: true },
              { href: route('finance.charges.index'), icon: Banknote, label: 'Gestão de Cobranças', pattern: '/financeiro/cobrancas', sub: true },
              { href: route('crm.index'), icon: Users, label: 'CRM & Retenção', pattern: '/crm', sub: true },
            ].map((item) => {
              const active = item.exact ? url === item.pattern : url.startsWith(item.pattern);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    active ? 'bg-white/20' : 'bg-muted group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <div className="absolute left-0 w-1 h-6 bg-white rounded-full -translate-x-1" />
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-border/50">
              {props.auth.can.manage_users && (
                <Link 
                  href={route('users.index')} 
                  prefetch
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                    url.startsWith('/usuarios') 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    url.startsWith('/usuarios') ? 'bg-white/20' : 'bg-muted group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  Usuários
                </Link>
              )}
              {props.auth.can.manage_settings && (
                <Link 
                  href={route('configuracoes.general.index')} 
                  prefetch
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                    url.startsWith('/configuracoes') 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    url.startsWith('/configuracoes') ? 'bg-white/20' : 'bg-muted group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Settings className="w-5 h-5" />
                  </div>
                  Configurações
                </Link>
              )}
            </div>
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
