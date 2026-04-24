import React from 'react';
import { Head, router } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Clock, UserCircle2, ArrowRightLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WeeklyScheduleEditor from './Components/WeeklyScheduleEditor';
import AppLayout from '@/Layouts/AppLayout';
import { SectionCard } from '@/components/Shared/SectionCard';

interface Professional {
    id: number;
    name: string;
}

interface Schedule {
    id?: number;
    weekday: number;
    start_time: string;
    end_time: string;
    break_start: string | null;
    break_end: string | null;
    is_active: boolean;
}

interface Props {
    professionals: Professional[];
    selectedProfessionalId: number;
    schedules: Schedule[];
}

export default function Index({ professionals, selectedProfessionalId, schedules }: Props) {
    const handleProfessionalChange = (value: string) => {
        // @ts-expect-error
        router.get(route('configuracoes.schedules.index'), { professional_id: value }, {
            preserveState: true,
            replace: true
        });
    };

    return (
        <>
            <Head title="Horários - Configurações" />
            
            <div className="max-w-5xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-muted/20 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-black text-foreground tracking-tight uppercase text-xs">Escala do Profissional</h4>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Selecione para ajustar os horários</p>
                        </div>
                    </div>

                    <div className="w-full md:w-80">
                        <Select 
                            value={selectedProfessionalId.toString()} 
                            onValueChange={handleProfessionalChange}
                        >
                            <SelectTrigger className="h-12 rounded-xl bg-card border-border/60 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <UserCircle2 className="w-4 h-4 text-primary" />
                                    <SelectValue placeholder="Selecione um profissional" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {professionals.map((pro) => (
                                    <SelectItem key={pro.id} value={pro.id.toString()}>
                                        {pro.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <SectionCard noPadding>
                    <div className="p-1">
                        {selectedProfessionalId ? (
                            <WeeklyScheduleEditor 
                                professionalId={selectedProfessionalId} 
                                schedules={schedules} 
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <ArrowRightLeft className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    Nenhum profissional selecionado
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Escolha um membro da equipe acima para editar sua escala.</p>
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Horários de Trabalho">{page}</ConfigLayout>
    </AppLayout>
);

