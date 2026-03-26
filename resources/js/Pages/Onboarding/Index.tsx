import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    CheckCircle2, 
    Circle, 
    ChevronRight,
    Settings,
    Users,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingProps {
    step: number;
    hasSettings: boolean;
    hasServices: boolean;
    hasProfessionals: boolean;
    hasSchedules: boolean;
}

export default function Index({ step, hasSettings, hasServices, hasProfessionals, hasSchedules }: OnboardingProps) {
    const steps = [
        {
            id: 1,
            title: 'Configurações',
            description: 'Nome da empresa, fuso horário e moeda.',
            icon: <Settings className="w-5 h-5" />,
            route: route('configuracoes.general.index'),
            completed: hasSettings
        },
        {
            id: 2,
            title: 'Serviços',
            description: 'Cadastre os serviços que sua empresa oferece.',
            icon: <Settings className="w-5 h-5" />,
            route: route('configuracoes.services.create'),
            completed: hasServices
        },
        {
            id: 3,
            title: 'Profissionais',
            description: 'Adicione os profissionais que realizam os serviços.',
            icon: <Users className="w-5 h-5" />,
            route: route('configuracoes.professionals.create'),
            completed: hasProfessionals
        },
        {
            id: 4,
            title: 'Horários',
            description: 'Defina a agenda de trabalho de cada profissional.',
            icon: <Calendar className="w-5 h-5" />,
            route: route('configuracoes.schedules.index'),
            completed: hasSchedules
        }
    ];

    return (
        <GuestLayout>
            <Head title="Bem-vindo ao Agenda Pro" />

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vamos configurar seu sistema</h1>
                <p className="text-muted-foreground mt-2">Siga os passos abaixo para começar a usar o Agenda Pro.</p>
            </div>

            <div className="space-y-4">
                {steps.map((s) => (
                    <Card key={s.id} className={`${s.id === step ? 'border-primary ring-1 ring-primary/20' : 'opacity-70'} transition-all`}>
                        <CardHeader className="p-4 flex flex-row items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.completed ? 'bg-emerald-100 text-emerald-600' : (s.id === step ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400')}`}>
                                {s.completed ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    Passo {s.id}: {s.title}
                                    {s.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                </CardTitle>
                                <CardDescription>{s.description}</CardDescription>
                            </div>
                            {s.completed ? (
                                <Link href={s.route}>
                                    <Button size="sm" variant="outline" className="flex items-center gap-1 border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                                        Revisar <ChevronRight className="w-4 h-4 text-emerald-500" />
                                    </Button>
                                </Link>
                            ) : s.id === step && (
                                <Link href={s.route}>
                                    <Button size="sm" className="flex items-center gap-1">
                                        Começar <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
                <p className="text-sm text-primary font-medium">
                    {step === 1 ? 'Primeiro, configure os dados da sua empresa.' : 
                     step === 2 ? 'Ótimo! Agora adicione os serviços oferecidos.' : 
                     step === 3 ? 'Perfeito! Cadastre pelo menos um profissional.' : 
                     'Quase lá! Defina os horários de trabalho.'}
                </p>
            </div>

            {hasSettings && hasServices && hasProfessionals && hasSchedules && (
                <div className="mt-8">
                    <Link href={route('dashboard')}>
                        <Button className="w-full h-12 text-lg font-bold flex items-center justify-center gap-2">
                            Tudo pronto! Ir para o Dashboard <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            )}
        </GuestLayout>
    );
}

declare var route: any;
