import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from './types';

interface Props {
    services: Service[];
    /** Currently selected service — pass null when used in the profile view (no pre-selection) */
    selected: Service | null;
    onSelect: (service: Service) => void;
    /** Title shown above the grid. Omit in profile view to let the parent control headings. */
    title?: string;
    description?: string;
}

export default function ServiceSelector({ services, selected, onSelect, title, description }: Props) {
    if (services.length === 0) {
        return (
            <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                Nenhum serviço disponível para agendamento no momento.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {title && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{title}</h2>
                    {description && <p className="text-slate-500">{description}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => onSelect(s)}
                        className={cn(
                            'w-full text-left p-5 rounded-2xl border-2 transition-all duration-150 group hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                            selected?.id === s.id
                                ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                : 'border-slate-100 bg-white hover:border-indigo-200',
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: name + description */}
                            <div className="flex-1 min-w-0">
                                <div
                                    className={cn(
                                        'font-semibold text-base transition-colors',
                                        selected?.id === s.id ? 'text-indigo-800' : 'text-slate-900 group-hover:text-indigo-700',
                                    )}
                                >
                                    {s.name}
                                </div>
                                {s.description && (
                                    <div className="text-sm text-slate-500 mt-1 line-clamp-2">{s.description}</div>
                                )}
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                    <Clock size={12} />
                                    <span>{s.duration_minutes} min</span>
                                </div>
                            </div>

                            {/* Right: price */}
                            <div className="shrink-0 text-right">
                                <div
                                    className={cn(
                                        'text-lg font-bold',
                                        selected?.id === s.id ? 'text-indigo-700' : 'text-indigo-600',
                                    )}
                                >
                                    R${' '}
                                    {parseFloat(s.price).toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                    })}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
