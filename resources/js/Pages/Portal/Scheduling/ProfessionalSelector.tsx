import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Professional } from './types';

interface Props {
    professionals: Professional[];
    selected: Professional | null;
    onSelect: (p: Professional) => void;
}

export default function ProfessionalSelector({ professionals, selected, onSelect }: Props) {
    if (professionals.length === 0) return null;

    // Single professional: show as a static info strip — no interaction needed
    if (professionals.length === 1) {
        const p = professionals[0];
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                <Avatar name={p.name} />
                <div>
                    <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.specialty || 'Especialista'}</div>
                </div>
            </div>
        );
    }

    // Multiple: selectable chips
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Profissional</label>
            <div className="flex flex-wrap gap-2">
                {professionals.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-150',
                            selected?.id === p.id
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700',
                        )}
                    >
                        <Avatar name={p.name} small />
                        {p.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Consistent avatar placeholder — uses initials */
function Avatar({ name, small }: { name: string; small?: boolean }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    return (
        <div
            className={cn(
                'rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold shrink-0',
                small ? 'h-6 w-6 text-[10px]' : 'h-10 w-10 text-sm',
            )}
        >
            {initials || <User size={small ? 10 : 16} />}
        </div>
    );
}
