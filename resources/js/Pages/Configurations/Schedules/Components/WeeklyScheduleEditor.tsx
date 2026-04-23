import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

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
    professionalId: number;
    schedules: Schedule[];
}

const WEEKDAYS = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export default function WeeklyScheduleEditor({ professionalId, schedules }: Props) {
    // Initialize form with 7 days
    const initialSchedules = Array.from({ length: 7 }, (_, i) => {
        const existing = schedules.find(s => s.weekday === i);
        return existing || {
            weekday: i,
            start_time: '09:00',
            end_time: '18:00',
            break_start: '12:00',
            break_end: '13:00',
            is_active: i !== 0 && i !== 6, // Default inactive on weekends
        };
    }).map(s => ({
        ...s,
        // Format H:i:s to H:i
        start_time: s.start_time.substring(0, 5),
        end_time: s.end_time.substring(0, 5),
        break_start: s.break_start?.substring(0, 5) || '',
        break_end: s.break_end?.substring(0, 5) || '',
    }));

    const { data, setData, post, processing } = useForm({
        professional_id: professionalId,
        schedules: initialSchedules,
    });

    // Update form when professionalId or schedules change
    React.useEffect(() => {
        setData({
            professional_id: professionalId,
            schedules: initialSchedules,
        });
    }, [professionalId, schedules]);

    const handleToggleDay = (index: number) => {
        const newSchedules = [...data.schedules];
        newSchedules[index].is_active = !newSchedules[index].is_active;
        setData('schedules', newSchedules);
    };

    const handleTimeChange = (index: number, field: keyof Schedule, value: string) => {
        const newSchedules = [...data.schedules];
        (newSchedules[index] as any)[field] = value;
        setData('schedules', newSchedules);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // @ts-expect-error
        post(route('configuracoes.schedules.store'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Dia</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Status</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Entrada</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Saída</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Intervalo (Início)</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase text-muted-foreground">Intervalo (Fim)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {data.schedules.map((day, idx) => (
                            <tr key={idx} className={`${day.is_active ? '' : 'bg-muted/30 opacity-60'} transition-all`}>
                                <td className="px-6 py-4 font-bold text-foreground">
                                    {WEEKDAYS[day.weekday]}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={day.is_active}
                                            onChange={() => handleToggleDay(idx)}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                        <span className="text-xs uppercase font-bold text-foreground">
                                            {day.is_active ? 'Aberto' : 'Fechado'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Input
                                        type="time"
                                        value={day.start_time}
                                        disabled={!day.is_active}
                                        onChange={(e) => handleTimeChange(idx, 'start_time', e.target.value)}
                                        className="h-9 w-32"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <Input
                                        type="time"
                                        value={day.end_time}
                                        disabled={!day.is_active}
                                        onChange={(e) => handleTimeChange(idx, 'end_time', e.target.value)}
                                        className="h-9 w-32"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <Input
                                        type="time"
                                        value={day.break_start || ''}
                                        disabled={!day.is_active}
                                        onChange={(e) => handleTimeChange(idx, 'break_start', e.target.value)}
                                        className="h-9 w-32 text-muted-foreground"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <Input
                                        type="time"
                                        value={day.break_end || ''}
                                        disabled={!day.is_active}
                                        onChange={(e) => handleTimeChange(idx, 'break_end', e.target.value)}
                                        className="h-9 w-32 text-muted-foreground"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end p-4 bg-muted/20 rounded-xl border border-dashed border-border">
                <Button 
                    type="submit" 
                    disabled={processing} 
                    className="gap-2 px-8 h-10 shadow-lg shadow-primary/20"
                >
                    <Save className="w-4 h-4" />
                    {processing ? 'Salvando...' : 'Salvar Horários de Trabalho'}
                </Button>
            </div>
        </form>
    );
}
