import { useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronRight,
    Settings,
    Users,
    Calendar,
    ArrowRight,
    Link as LinkIcon,
    Copy,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivationItem {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    route?: string;
}

interface OnboardingProps {
    step: number;
    hasSettings: boolean;
    hasServices: boolean;
    hasProfessionals: boolean;
    hasServiceProfessionalLink: boolean;
    hasSchedules: boolean;
    hasAvailableSlot: boolean;
    isActivationReady: boolean;
    publicBookingPath: string;
    publicBookingUrl: string;
    portalCurrentPath: string;
    portalOfficialPath: string;
    activationWindowDays: number;
    firstAvailableSlot: {
        date: string;
        time: string;
        service: string;
        professional: string;
    } | null;
}

export default function Index({
    step,
    hasSettings,
    hasServices,
    hasProfessionals,
    hasServiceProfessionalLink,
    hasSchedules,
    hasAvailableSlot,
    isActivationReady,
    publicBookingPath,
    publicBookingUrl,
    portalCurrentPath,
    portalOfficialPath,
    activationWindowDays,
    firstAvailableSlot,
}: OnboardingProps) {
    const [copied, setCopied] = useState(false);

    const items: ActivationItem[] = [
        {
            id: 'settings',
            title: 'Empresa configurada',
            description: 'Nome da empresa e dados básicos preenchidos.',
            completed: hasSettings,
            route: route('configuracoes.general.index'),
        },
        {
            id: 'services',
            title: 'Serviço ativo',
            description: 'Pelo menos um serviço disponível para agendamento.',
            completed: hasServices,
            route: route('configuracoes.services.create'),
        },
        {
            id: 'professionals',
            title: 'Profissional ativo',
            description: 'Pelo menos um profissional cadastrado e ativo.',
            completed: hasProfessionals,
            route: route('configuracoes.professionals.create'),
        },
        {
            id: 'link',
            title: 'Serviço vinculado a profissional',
            description: 'O serviço precisa estar associado a quem pode atendê-lo.',
            completed: hasServiceProfessionalLink,
            route: route('configuracoes.professionals.index'),
        },
        {
            id: 'schedules',
            title: 'Horário ativo',
            description: 'Pelo menos um dia de atendimento ativo na escala semanal.',
            completed: hasSchedules,
            route: route('configuracoes.schedules.index'),
        },
        {
            id: 'slot',
            title: 'Slot público disponível',
            description: `Encontrar um horário futuro nos próximos ${activationWindowDays} dias corridos.`,
            completed: hasAvailableSlot,
            route: route('configuracoes.schedules.index'),
        },
    ];

    const nextItem = items.find((item) => !item.completed);

    const copyPublicLink = async () => {
        await navigator.clipboard.writeText(publicBookingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <GuestLayout>
            <Head title="Ativação do AgendaNexo" />

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deixe seu link pronto para receber agendamentos</h1>
                <p className="text-muted-foreground mt-2">
                    O primeiro valor é ter um link público com pelo menos um horário realmente disponível.
                </p>
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <Card key={item.id} className={`${item.completed ? 'border-emerald-200' : index + 1 === step || item.id === nextItem?.id ? 'border-primary ring-1 ring-primary/20' : 'opacity-80'} transition-all`}>
                        <CardHeader className="p-4 flex flex-row items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                {item.completed ? <CheckCircle2 className="w-6 h-6" /> : item.id === 'professionals' || item.id === 'link' ? <Users className="w-5 h-5" /> : item.id === 'schedules' || item.id === 'slot' ? <Calendar className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                    {item.title}
                                    {item.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                </CardTitle>
                                <CardDescription>{item.description}</CardDescription>
                            </div>
                            {item.route && (
                                <Link href={item.route}>
                                    <Button size="sm" variant={item.completed ? 'outline' : 'default'} className="flex items-center gap-1">
                                        {item.completed ? 'Revisar' : 'Resolver'} <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className={`mt-6 p-4 rounded-xl border ${isActivationReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                <p className="text-sm font-medium">
                    {isActivationReady
                        ? 'Tudo pronto para receber agendamentos. Seu link público já pode ser compartilhado.'
                        : nextItem
                            ? `Próximo passo: ${nextItem.title.toLowerCase()}.`
                            : 'Confira os dados antes de compartilhar seu link público.'}
                </p>
                {firstAvailableSlot && (
                    <p className="text-xs mt-2 opacity-80">
                        Primeiro horário encontrado: {firstAvailableSlot.date} às {firstAvailableSlot.time}, {firstAvailableSlot.service} com {firstAvailableSlot.professional}.
                    </p>
                )}
            </div>

            <div className="mt-6 p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-3">
                <div className="flex items-start gap-3">
                    <LinkIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Link público oficial</p>
                        <p className="text-sm text-muted-foreground break-all">{publicBookingUrl}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Marketing: agendanexo.com.br. App: app.agendanexo.com.br. Portal atual: {portalCurrentPath}; padrão oficial futuro documentado: {portalOfficialPath}.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Button type="button" variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={copyPublicLink}>
                        <Copy className="w-4 h-4" /> {copied ? 'Link copiado' : 'Copiar link'}
                    </Button>
                    <Button type="button" variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => window.open(publicBookingPath, '_blank')}>
                        <ExternalLink className="w-4 h-4" /> Abrir portal
                    </Button>
                    <Link href={route('agenda')} className="w-full sm:w-auto">
                        <Button className="gap-2 w-full">
                            Abrir agenda <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}

declare var route: any;
