import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
    slots: string[];
    selected: string | null;
    loading: boolean;
    /** True when no professionals are linked to the selected service */
    noProfessionals: boolean;
    onSelect: (slot: string) => void;
}

export default function TimeSlotGrid({ slots, selected, loading, noProfessionals, onSelect }: Props) {
    if (noProfessionals) {
        return (
            <EmptyState message="Nenhum profissional disponível para este serviço." />
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <EmptyState message="Nenhum horário disponível para esta data. Tente outro dia ou profissional." />
        );
    }

    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Horário</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {slots.map((slot) => (
                    <button
                        key={slot}
                        onClick={() => onSelect(slot)}
                        className={cn(
                            'py-2.5 text-sm font-semibold rounded-xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                            selected === slot
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:text-indigo-700',
                        )}
                    >
                        {slot}
                    </button>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-8 bg-slate-50 rounded-2xl text-center text-slate-400 text-sm border border-slate-100">
            {message}
        </div>
    );
}
