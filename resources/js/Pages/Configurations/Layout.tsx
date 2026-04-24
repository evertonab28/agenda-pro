import { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { route } from '@/utils/route';
import { 
    Scissors, 
    UserCircle, 
    Clock, 
    CalendarDays, 
    Settings2,
    PlugZap,
    CreditCard,
    Palette
} from 'lucide-react';
import { PageHeader } from '@/components/Shared/PageHeader';

interface ConfigLayoutProps {
    children: ReactNode;
    title: string;
}

export default function ConfigLayout({ children, title }: ConfigLayoutProps) {
    const { url, props } = usePage<any>();
    
    const tabs = [
        { name: 'Serviços', href: route('configuracoes.services.index'), icon: Scissors, pattern: '/configuracoes/servicos' },
        { name: 'Profissionais', href: route('configuracoes.professionals.index'), icon: UserCircle, pattern: '/configuracoes/profissionais' }, 
        { name: 'Horários', href: route('configuracoes.schedules.index'), icon: Clock, pattern: '/configuracoes/horarios' },
        { name: 'Feriados', href: route('configuracoes.holidays.index'), icon: CalendarDays, pattern: '/configuracoes/feriados' },
        { name: 'Geral', href: route('configuracoes.general.index'), icon: Settings2, pattern: '/configuracoes/geral' },
        { name: 'Integrações', href: route('configuracoes.integrations'), icon: PlugZap, pattern: '/configuracoes/integrations-list' },
        { name: 'Assinatura', href: route('configuracoes.billing.index'), icon: CreditCard, pattern: '/configuracoes/assinatura' },
        { name: 'Aparência', href: route('configuracoes.visual_settings'), icon: Palette, pattern: '/configuracoes/estilo' },
    ];

    const isCurrent = (pattern: string) => url.startsWith(pattern);

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Configurações" 
                subtitle="Gerencie as preferências e parâmetros do seu sistema." 
            />

            {!props.auth.hide_nav && (
                <div className="bg-muted/30 p-1.5 rounded-2xl border border-border/40 inline-flex flex-wrap gap-1 w-full sm:w-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isCurrent(tab.pattern);
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`
                                    group flex items-center py-3 px-6 rounded-xl font-black text-xs whitespace-nowrap transition-all duration-200 uppercase tracking-widest
                                    ${active 
                                        ? 'bg-card text-primary shadow-md ring-1 ring-border/60 scale-105' 
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }
                                `}
                            >
                                <Icon className={`h-4 h-4 mr-2.5 ${active ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground'}`} />
                                {tab.name}
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {children}
            </div>
        </div>
    );
}
