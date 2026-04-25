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
        <div className="py-12 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200 px-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-[240px] mx-auto">
                {message}
            </p>
        </div>
    );
}
