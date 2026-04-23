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
  DollarSign,
  Sun,
  Moon,
} from 'lucide-react';
import { route } from '@/utils/route';
import { Link, usePage } from '@inertiajs/react';
import { useAppearance } from '@/Hooks/useAppearance';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { mode, updateAppearance } = useAppearance(); // Gerencia a aplicação do tema globalmente
  const isDark = mode === 'dark' || (mode === 'system' && typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
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
      {/* Sidebar - CAMADA 1: ESTRUTURA */}
      {!props.auth.hide_nav && (
        <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.05)] h-screen sticky top-0">
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
            <span className="text-sidebar-primary font-black text-xl tracking-tight">
              Agenda<span className="text-primary">Nexo</span>
            </span>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6 space-y-1">
            {[
              { href: route('dashboard'), icon: LayoutDashboard, label: 'Dashboard', pattern: '/dashboard', exact: true },
              { href: route('dashboard.executive'), icon: TrendingUp, label: 'BI Executivo', pattern: '/dashboard/executivo' },
              { href: route('agenda'), icon: Calendar, label: 'Agenda de Serviços', pattern: '/agenda' },
              { href: route('customers.index'), icon: Users, label: 'Clientes', pattern: '/customers' },
              { href: route('waitlist.index'), icon: Users, label: 'Lista de Espera', pattern: '/lista-espera', sub: true },
              { href: route('packages.index'), icon: Package, label: 'Pacotes & Planos', pattern: '/pacotes' },
              { href: route('finance.dashboard'), icon: Banknote, label: 'Financeiro', pattern: '/financeiro', exact: true },
              { href: route('finance.charges.index'), icon: Banknote, label: 'Cobranças', pattern: '/financeiro/cobrancas', sub: true },
              { href: route('crm.index'), icon: Users, label: 'Marketing & CRM', pattern: '/crm', sub: true },
            ].map((item) => {
              const active = item.exact ? url === item.pattern : url.startsWith(item.pattern);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch
                  className={`group relative flex items-center gap-3 px-6 py-3 text-sm font-bold transition-all duration-150 ${
                    active
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-primary'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                </Link>
              );
            })}

            <div className="mt-8 pt-8 border-t border-sidebar-border/30">
              <div className="px-6 mb-4 text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/50">
                Administração
              </div>
              {props.auth.can.manage_users && (
                <Link 
                  href={route('users.index')} 
                  prefetch
                  className={`group flex items-center gap-3 px-6 py-3 text-sm font-bold transition-all duration-150 ${
                    url.startsWith('/usuarios') 
                      ? 'bg-sidebar-accent text-sidebar-primary' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                  }`}
                >
                  <Users className={`w-5 h-5 ${url.startsWith('/usuarios') ? 'text-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-primary'}`} />
                  Equipe
                </Link>
              )}
              {props.auth.can.manage_settings && (
                <Link 
                  href={route('configuracoes.general.index')} 
                  prefetch
                  className={`group flex items-center gap-3 px-6 py-3 text-sm font-bold transition-all duration-150 ${
                    url.startsWith('/configuracoes') 
                      ? 'bg-sidebar-accent text-sidebar-primary' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                  }`}
                >
                  <Settings className={`w-5 h-5 ${url.startsWith('/configuracoes') ? 'text-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-primary'}`} />
                  Configurações
                </Link>
              )}
            </div>
          </nav>

          {/* User Section at bottom */}
          <div className="p-4 border-t border-sidebar-border/30 bg-sidebar-accent/20">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs border border-primary/30">
                {props.auth.user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-sidebar-primary truncate">{props.auth.user.name}</p>
                <p className="text-[10px] text-sidebar-foreground truncate uppercase tracking-tighter">{props.auth.user.role}</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area - CAMADA 2: CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        {!props.auth.hide_nav && (
          <header className="h-16 flex-shrink-0 bg-card border-b border-border flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-black text-foreground tracking-tight">{props.title || ''}</h1>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="h-8 w-px bg-border/60" />
               <button
                 onClick={() => updateAppearance({ theme_mode: isDark ? 'light' : 'dark' })}
                 className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                 aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
               >
                 {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>
               <div className="h-8 w-px bg-border/60" />
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">Status:</span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-success/10 text-success text-[10px] font-black uppercase border border-success/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Online
                  </span>
               </div>
               <div className="h-8 w-px bg-border/60" />
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
