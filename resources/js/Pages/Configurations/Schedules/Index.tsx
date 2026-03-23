import React from 'react';
import { Head, router } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WeeklyScheduleEditor from './Components/WeeklyScheduleEditor';

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
        <ConfigLayout title="Horários de Trabalho">
            <Head title="Horários - Configurações" />
            
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Escala Semanal</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Configure o horário de atendimento de cada profissional.
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-64">
                        <Select 
                            value={selectedProfessionalId.toString()} 
                            onChange={(e: any) => handleProfessionalChange(e.target.value)}
                        >
                            {professionals.map((pro) => (
                                <SelectItem key={pro.id} value={pro.id.toString()}>
                                    {pro.name}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="pt-4">
                    {selectedProfessionalId ? (
                        <WeeklyScheduleEditor 
                            professionalId={selectedProfessionalId} 
                            schedules={schedules} 
                        />
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl text-gray-400">
                            Nenhum profissional selecionado ou cadastrado.
                        </div>
                    )}
                </div>
            </div>
        </ConfigLayout>
    );
}

