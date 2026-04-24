import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Service, Professional } from './types';

interface Props {
    service: Service | null;
    professional: Professional | null;
    date: Date;
    slot: string | null;
    /** Navigate back to the date/time step to change the selection */
    onEdit: () => void;
}

/**
 * Compact inline review shown in step 3 above the contact form.
 * Gives the customer a final confirmation of what they're booking
 * and an "Alterar" escape hatch.
 */
export default function BookingReview({ service, professional, date, slot, onEdit }: Props) {
    return (
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="text-sm font-bold text-indigo-900">Resumo do agendamento</h4>
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 shrink-0"
                >
                    Alterar
                </button>
            </div>

            <div className="space-y-1.5 text-sm">
                {service && (
                    <div className="flex items-center justify-between text-indigo-900">
                        <span className="font-semibold">{service.name}</span>
                        <span className="font-bold">
                            R${' '}
                            {parseFloat(service.price).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                            })}
                        </span>
                    </div>
                )}

                {professional && (
                    <div className="text-indigo-600 text-sm">{professional.name}</div>
                )}

                {slot && (
                    <div className="flex items-center gap-2 text-indigo-700 pt-0.5">
                        <Calendar size={13} />
                        <span className="capitalize">
                            {format(date, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <Clock size={13} className="ml-1" />
                        <span>às {slot}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
