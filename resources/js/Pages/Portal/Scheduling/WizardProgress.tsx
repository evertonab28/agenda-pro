import React from 'react';
import { cn } from '@/lib/utils';

const STEPS = [
    { label: 'Serviço', short: '1' },
    { label: 'Horário', short: '2' },
    { label: 'Dados',   short: '3' },
];

interface Props {
    /** Current wizard step (1–3). Step 4 (success) does not render this component. */
    step: number;
}

export default function WizardProgress({ step }: Props) {
    return (
        <div className="flex items-center justify-center gap-0 mb-10">
            {STEPS.map((s, i) => {
                const num     = i + 1;
                const isActive = num === step;
                const isDone   = num < step;

                return (
                    <React.Fragment key={num}>
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200',
                                    isActive && 'bg-indigo-600 border-indigo-600 text-white scale-110',
                                    isDone   && 'bg-indigo-500 border-indigo-500 text-white',
                                    !isActive && !isDone && 'border-slate-200 text-slate-400 bg-white',
                                )}
                            >
                                {isDone ? '✓' : num}
                            </div>
                            <span
                                className={cn(
                                    'mt-1.5 text-xs font-medium transition-colors',
                                    isActive ? 'text-indigo-700' : isDone ? 'text-indigo-400' : 'text-slate-400',
                                )}
                            >
                                {s.label}
                            </span>
                        </div>

                        {i < STEPS.length - 1 && (
                            <div
                                className={cn(
                                    'h-0.5 w-12 sm:w-20 mx-2 mb-5 transition-all duration-300',
                                    isDone ? 'bg-indigo-400' : 'bg-slate-200',
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
