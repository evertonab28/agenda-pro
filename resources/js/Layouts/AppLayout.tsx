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
  Building2,
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
        <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col z-20 h-screen sticky top-0 overflow-hidden">
          {/* TOPO FIXO: Logo */}
          <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-sidebar-border/50 bg-sidebar">
            <span className="text-sidebar-primary font-black text-xl tracking-tight">
              Agenda<span className="text-primary">Nexo</span>
            </span>
          </div>
          
          {/* ÁREA CENTRAL ROLÁVEL: Menus */}
          <nav className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
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
                  className={`group relative flex items-center gap-3 px-6 py-2.5 text-sm font-bold transition-all duration-150 ${
                    active
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-primary'}`} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[2px_0_12px_var(--primary)]" />
                  )}
                </Link>
              );
            })}

            <div className="mt-6 pt-6 border-t border-sidebar-border/50">
              <div className="px-6 mb-4 text-xs font-black uppercase tracking-[0.2em] text-sidebar-foreground/40">
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

          {/* RODAPÉ FIXO: Workspace */}
          <div className="flex-shrink-0 p-4 border-t border-sidebar-border/50 bg-sidebar-accent/20">
            <div className="flex flex-col gap-4">
              {/* Workspace / Context */}
              <div className="px-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center border border-sidebar-border/50 shadow-sm">
                  <Building2 className="w-4 h-4 text-sidebar-primary/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-sidebar-foreground/30 uppercase tracking-[0.15em] leading-none mb-1.5">Unidade / Filial</p>
                  <p className="text-sm font-bold text-sidebar-primary truncate">{props.auth.workspace?.name || 'Sede Principal'}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area - CAMADA 2: CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        {!props.auth.hide_nav && (
          <header className="h-16 flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border/60 flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4">
              {props.title && (
                <>
                  <p className="text-lg font-bold text-foreground tracking-tight">{props.title}</p>
                  <div className="h-6 w-px bg-border/40" />
                </>
              )}
              <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-black uppercase border border-success/20 tracking-tight">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Operacional
                  </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="hidden lg:flex items-center bg-muted/50 rounded-full px-3 py-1.5 border border-border/50 focus-within:border-primary/50 transition-colors">
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Pesquisar..." className="bg-transparent border-none focus:ring-0 text-xs ml-2 w-32 placeholder:text-muted-foreground/60" />
               </div>

               <div className="h-6 w-px bg-border/40" />
               
               <Link href={route('configuracoes.general.index')} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Ajuda & Suporte">
                  <HelpCircle className="w-5 h-5" />
               </Link>

               <button
                 onClick={() => updateAppearance({ theme_mode: isDark ? 'light' : 'dark' })}
                 className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                 aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
               >
                 {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>

               <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Bell className="w-5 h-5" />
                  <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
               </button>

               <div className="h-6 w-px bg-border/40 mx-2" />

               <div className="relative group">
                  <button className="flex items-center gap-3 pl-2 py-1.5 rounded-xl hover:bg-muted transition-colors cursor-pointer outline-none">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-black text-foreground leading-none">{props.auth.user.name}</span>
                        <span className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1.5">{props.auth.user.role}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-inner transition-transform group-hover:scale-105">
                        {props.auth.user.name.charAt(0)}
                    </div>
                  </button>

                  {/* Simple Dropdown on Hover/Focus */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border shadow-2xl rounded-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-2 border-b border-border/50 mb-1">
                      <p className="text-xs font-bold text-foreground truncate">{props.auth.user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate uppercase">{props.auth.user.role}</p>
                    </div>
                    <Link href={route('configuracoes.general.index')} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <Settings className="w-4 h-4" /> Configurações
                    </Link>
                    <Link 
                      href={route('logout')} 
                      method="post" 
                      as="button" 
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sair do Sistema
                    </Link>
                  </div>
               </div>
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
              : 'bg-destructive-bg border-destructive/20 text-destructive-text'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive" />
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
