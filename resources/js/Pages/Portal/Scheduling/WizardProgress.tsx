import React from 'react';
import { cn } from '@/lib/utils';

export const WIZARD_STEPS = [
    { label: 'Serviço',      short: 'Serviço'      },
    { label: 'Profissional', short: 'Profissional'  },
    { label: 'Data',         short: 'Data'          },
    { label: 'Horário',      short: 'Horário'       },
    { label: 'Seus dados',   short: 'Dados'         },
    { label: 'Revisão',      short: 'Revisão'       },
];

interface Props {
    /**
     * Current active step (1-based). Steps beyond WIZARD_STEPS.length
     * (i.e. the success screen) should not render this component at all.
     */
    step: number;
}

export default function WizardProgress({ step }: Props) {
    const total   = WIZARD_STEPS.length;
    const pct     = Math.round(((step - 1) / (total - 1)) * 100);
    const current = WIZARD_STEPS[step - 1];

    return (
        <div className="mb-10 select-none">
            {/* Label row */}
            <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-slate-800">
                    {current?.label}
                </span>
                <span className="text-xs font-medium text-slate-400 tabular-nums">
                    {step} de {total}
                </span>
            </div>

            {/* Track */}
            <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all duration-500 ease-out',
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Step dots — always 6, fills/highlights based on current step */}
            <div className="flex justify-between mt-2.5 px-px">
                {WIZARD_STEPS.map((s, i) => {
                    const num     = i + 1;
                    const isDone  = num < step;
                    const isActive = num === step;

                    return (
                        <div key={num} className="flex flex-col items-center gap-1">
                            <div
                                className={cn(
                                    'h-2 w-2 rounded-full transition-all duration-300',
                                    isDone   && 'bg-indigo-500',
                                    isActive && 'bg-indigo-600 scale-125',
                                    !isDone && !isActive && 'bg-slate-200',
                                )}
                            />
                            {/* Label: always hidden on xs, visible md+ */}
                            <span
                                className={cn(
                                    'hidden md:block text-[10px] font-medium transition-colors leading-tight',
                                    isActive ? 'text-indigo-600' : isDone ? 'text-indigo-300' : 'text-slate-300',
                                )}
                            >
                                {s.short}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
