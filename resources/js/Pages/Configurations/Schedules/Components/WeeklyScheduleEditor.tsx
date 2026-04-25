import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Save, Coffee, LogIn, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import { StatusPill } from '@/components/Shared/StatusPill';

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

declare var route: any;

function buildSchedules(schedules: Schedule[]) {
    return Array.from({ length: 7 }, (_, i) => {
        const existing = schedules.find(s => s.weekday === i);
        return existing || {
            weekday: i,
            start_time: '09:00',
            end_time: '18:00',
            break_start: '12:00',
            break_end: '13:00',
            is_active: i !== 0 && i !== 6,
        };
    }).map(s => ({
        ...s,
        start_time: s.start_time.substring(0, 5),
        end_time: s.end_time.substring(0, 5),
        break_start: s.break_start?.substring(0, 5) || '',
        break_end: s.break_end?.substring(0, 5) || '',
    }));
}

export default function WeeklyScheduleEditor({ professionalId, schedules }: Props) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        professional_id: professionalId,
        schedules: buildSchedules(schedules),
    });

    // Sync form whenever the selected professional (and their schedules) changes
    React.useEffect(() => {
        setData({
            professional_id: professionalId,
            schedules: buildSchedules(schedules),
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        post(route('configuracoes.schedules.store'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-0">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/30 border-b border-border/40">
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Dia da Semana</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status Operacional</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Expediente de Trabalho</th>
                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Intervalo de Descanso</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {data.schedules.map((day, idx) => (
                            <tr key={idx} className={`${day.is_active ? 'hover:bg-muted/20' : 'bg-muted/10 opacity-60'} transition-all group`}>
                                <td className="px-6 py-4 font-black text-foreground text-sm tracking-tight">
                                    {WEEKDAYS[day.weekday]}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleToggleDay(idx)}>
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={day.is_active}
                                                onChange={() => handleToggleDay(idx)}
                                            />
                                            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                        </div>
                                        <StatusPill 
                                            label={day.is_active ? 'ABERTO' : 'FECHADO'} 
                                            variant={day.is_active ? 'success' : 'muted'} 
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <LogIn className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="time"
                                                value={day.start_time}
                                                disabled={!day.is_active}
                                                onChange={(e) => handleTimeChange(idx, 'start_time', e.target.value)}
                                                className="h-10 pl-8 w-28 rounded-xl bg-muted/30 border-border/40 font-bold text-xs"
                                            />
                                        </div>
                                        <span className="text-[11px] font-black text-muted-foreground/40 px-1 uppercase tracking-widest">Até</span>
                                        <div className="relative">
                                            <LogOut className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="time"
                                                value={day.end_time}
                                                disabled={!day.is_active}
                                                onChange={(e) => handleTimeChange(idx, 'end_time', e.target.value)}
                                                className="h-10 pl-8 w-28 rounded-xl bg-muted/30 border-border/40 font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Coffee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="time"
                                                value={day.break_start || ''}
                                                disabled={!day.is_active}
                                                onChange={(e) => handleTimeChange(idx, 'break_start', e.target.value)}
                                                className="h-10 pl-8 w-28 rounded-xl bg-muted/30 border-border/40 font-bold text-xs"
                                            />
                                        </div>
                                        <span className="text-[11px] font-black text-muted-foreground/40 px-1">—</span>
                                        <div className="relative">
                                            <Coffee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <Input
                                                type="time"
                                                value={day.break_end || ''}
                                                disabled={!day.is_active}
                                                onChange={(e) => handleTimeChange(idx, 'break_end', e.target.value)}
                                                className="h-10 pl-8 w-28 rounded-xl bg-muted/30 border-border/40 font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-border/40 bg-muted/5 rounded-b-2xl">
                <div>
                    {recentlySuccessful && (
                        <div className="flex items-center gap-2 text-success font-black uppercase text-xs tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Escala salva com sucesso!
                        </div>
                    )}
                </div>
                <Button 
                    type="submit" 
                    disabled={processing} 
                    className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-11 px-8 rounded-xl font-bold uppercase tracking-wider text-xs gap-2"
                >
                    <Save className="w-4 h-4" />
                    {processing ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </form>
    );
}
