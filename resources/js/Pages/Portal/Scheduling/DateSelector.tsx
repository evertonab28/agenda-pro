import React from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
    days: Date[];
    selected: Date;
    onSelect: (d: Date) => void;
}

export default function DateSelector({ days, selected, onSelect }: Props) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Data</label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {days.map((date) => {
                    const active = isSameDay(date, selected);
                    const today  = isToday(date);

                    return (
                        <button
                            key={date.toString()}
                            onClick={() => onSelect(date)}
                            className={cn(
                                'flex flex-col items-center justify-center min-w-[62px] h-[72px] rounded-2xl border-2 transition-all duration-150 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                                active
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200',
                            )}
                        >
                            <span
                                className={cn(
                                    'text-[10px] uppercase font-semibold tracking-wide',
                                    active ? 'text-indigo-200' : 'text-slate-400',
                                )}
                            >
                                {today ? 'Hoje' : format(date, 'EEE', { locale: ptBR })}
                            </span>
                            <span className="text-lg font-bold leading-tight">{format(date, 'dd')}</span>
                            <span
                                className={cn(
                                    'text-[10px] capitalize',
                                    active ? 'text-indigo-300' : 'text-slate-400',
                                )}
                            >
                                {format(date, 'MMM', { locale: ptBR })}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
