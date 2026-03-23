import { ReactNode } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { route } from '@/utils/route';
import { 
    Scissors, 
    UserCircle, 
    Clock, 
    CalendarDays, 
    Settings2 
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
    ];

    const isCurrent = (pattern: string) => url.startsWith(pattern);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie as configurações do seu sistema.</p>
                </div>

                {!props.auth.hide_nav && (
                    <div className="border-b border-gray-200 dark:border-zinc-800">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const active = isCurrent(tab.pattern);
                                return (
                                    <Link
                                        key={tab.name}
                                        href={tab.href}
                                        className={`
                                            group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                                            ${active 
                                                ? 'border-primary text-primary' 
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className={`
                                            -ml-0.5 mr-2 h-5 w-5
                                            ${active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}
                                        `} />
                                        {tab.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
                    {children}
                </div>
            </div>
        </AppLayout>
    );
}
