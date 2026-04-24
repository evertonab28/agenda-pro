import React from 'react';
import { Calendar, Clock, User, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Service, Professional } from './types';

interface Props {
    service: Service | null;
    professional: Professional | null;
    date: Date | null;
    slot: string | null;
    className?: string;
}

/**
 * Persistent booking summary card.
 *
 * Used as a sticky sidebar on desktop (steps 2 and 3) and as an inline card
 * on mobile below the main step content.
 *
 * Renders nothing until at least one value is selected (avoids empty state flash).
 */
export default function BookingSummary({ service, professional, date, slot, className }: Props) {
    if (!service && !professional && !slot) return null;

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

            <div className="px-5 py-4 space-y-4">
                {/* Service */}
                {service && (
                    <Row icon={<Layers size={14} className="text-indigo-500" />}>
                        <span className="font-semibold text-slate-900 text-sm">{service.name}</span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                            {service.duration_minutes} min ·{' '}
                            R${' '}
                            {parseFloat(service.price).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                            })}
                        </span>
                    </Row>
                )}

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
                        <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Clock size={11} />
                            {slot}
                        </span>
                    </Row>
                )}
            </div>

            {/* Total — only show when both service and slot are selected */}
            {service && slot && (
                <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
                    <span className="text-base font-bold text-slate-900">
                        R${' '}
                        {parseFloat(service.price).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                        })}
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
