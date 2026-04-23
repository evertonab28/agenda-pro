import { ReactNode } from 'react';
import AppLayout from '@/Layouts/AppLayout';
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
            <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                <p className="text-muted-foreground">Gerencie as configurações do seu sistema.</p>
            </div>

            {!props.auth.hide_nav && (
                <div className="border-b border-border/60">
                    <nav className="-mb-px flex space-x-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = isCurrent(tab.pattern);
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    prefetch
                                    className={`
                                        group inline-flex items-center py-4 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all duration-200
                                        ${active 
                                            ? 'border-primary text-primary bg-primary/5' 
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }
                                    `}
                                >
                                    <div className={`
                                        mr-2.5 flex items-center justify-center w-7 h-7 rounded-lg transition-colors
                                        ${active ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'}
                                    `}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                {children}
            </div>
        </div>
    );
}
