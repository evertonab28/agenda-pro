import React from 'react';
import { Calendar, Clock, User, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Service, Professional } from './types';

interface Props {
    service: Service | null;
    addons?: Service[];
    professional: Professional | null;
    date: Date | null;
    slot: string | null;
    className?: string;
}

export default function BookingSummary({ service, addons = [], professional, date, slot, className }: Props) {
    if (!service && !professional && !slot) return null;

    const totalDuration = (service?.duration_minutes || 0) + addons.reduce((acc, curr) => acc + curr.duration_minutes, 0);
    const totalPrice = parseFloat(service?.price || '0') + addons.reduce((acc, curr) => acc + parseFloat(curr.price), 0);

    return (
        <div
            className={cn(
                'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden',
                className,
            )}
        >
            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Seu agendamento
                </h3>
            </div>

            <div className="px-5 py-4 space-y-5">
                {/* Main Service */}
                {service && (
                    <Row icon={<Layers size={14} className="text-indigo-500" />}>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm leading-tight">{service.name}</span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                                {service.duration_minutes} min · R$ {parseFloat(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </Row>
                )}

                {/* Addons */}
                {addons.map((addon) => (
                    <Row key={addon.id} icon={<Layers size={14} className="text-emerald-500" />}>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-sm leading-tight">{addon.name}</span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                                +{addon.duration_minutes} min · +R$ {parseFloat(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </Row>
                ))}

                {/* Professional */}
                {professional && (
                    <Row icon={<User size={14} className="text-slate-400" />}>
                        <span className="font-semibold text-slate-900 text-sm">{professional.name}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                            {professional.specialty || 'Especialista'}
                        </span>
                    </Row>
                )}

                {/* Date + time */}
                {date && slot && (
                    <Row icon={<Calendar size={14} className="text-slate-400" />}>
                        <span className="font-semibold text-slate-900 text-sm capitalize">
                            {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <div className="flex flex-col mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock size={11} />
                                {slot}
                            </span>
                            <span className="text-[10px] text-slate-300 mt-0.5">
                                Duração total: {totalDuration} min
                            </span>
                        </div>
                    </Row>
                )}
            </div>

            {/* Total */}
            {service && (
                <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
                    <span className="text-base font-bold text-slate-900">
                        R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            )}
        </div>
    );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}
