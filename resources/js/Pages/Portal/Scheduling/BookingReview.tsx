import React from 'react';
import { Calendar, Clock, User, Layers, Phone, Mail, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fullName } from './types';
import type { Service, Professional, BookingFormData } from './types';

interface Props {
    service: Service | null;
    professional: Professional | null;
    date: Date;
    slot: string | null;
    formData: BookingFormData;
    /** Jump to a specific wizard step to edit that section */
    onEditStep: (step: number) => void;
    /** Trigger the actual booking POST */
    onConfirm: () => void;
    loading: boolean;
}

export default function BookingReview({
    service, professional, date, slot, formData,
    onEditStep, onConfirm, loading,
}: Props) {
    const name = fullName(formData);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Confirme seu agendamento</h2>
                <p className="text-sm text-slate-500">
                    Verifique todos os detalhes antes de confirmar.
                </p>
            </div>

            {/* Review card */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-50">

                {/* Service */}
                <ReviewRow
                    icon={<Layers size={14} className="text-indigo-500" />}
                    label="Serviço"
                    onEdit={() => onEditStep(1)}
                >
                    <span className="font-semibold text-slate-900">{service?.name}</span>
                    {service && (
                        <span className="text-xs text-slate-400 block mt-0.5">
                            {service.duration_minutes} min ·{' '}
                            R${' '}
                            {parseFloat(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    )}
                </ReviewRow>

                {/* Professional */}
                <ReviewRow
                    icon={<User size={14} className="text-slate-400" />}
                    label="Profissional"
                    onEdit={() => onEditStep(2)}
                >
                    <span className="font-semibold text-slate-900">{professional?.name}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                        {professional?.specialty || 'Especialista'}
                    </span>
                </ReviewRow>

                {/* Date */}
                <ReviewRow
                    icon={<Calendar size={14} className="text-slate-400" />}
                    label="Data"
                    onEdit={() => onEditStep(3)}
                >
                    <span className="font-semibold text-slate-900 capitalize">
                        {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                </ReviewRow>

                {/* Time */}
                <ReviewRow
                    icon={<Clock size={14} className="text-slate-400" />}
                    label="Horário"
                    onEdit={() => onEditStep(4)}
                >
                    <span className="font-semibold text-slate-900">{slot}</span>
                </ReviewRow>

                {/* Contact */}
                <ReviewRow
                    icon={<Phone size={14} className="text-slate-400" />}
                    label="Seus dados"
                    onEdit={() => onEditStep(5)}
                >
                    <span className="font-semibold text-slate-900">{name || '—'}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{formData.phone}</span>
                    {formData.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Mail size={11} />
                            {formData.email}
                        </span>
                    )}
                </ReviewRow>
            </div>

            {/* Price total */}
            {service && (
                <div className="flex items-center justify-between px-5 py-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <span className="text-sm font-semibold text-indigo-900">Total</span>
                    <span className="text-xl font-bold text-indigo-700">
                        R${' '}
                        {parseFloat(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            )}

            {/* Confirm CTA */}
            <Button
                className="w-full h-12 text-base font-semibold shadow-lg shadow-indigo-100"
                onClick={onConfirm}
                disabled={loading}
            >
                {loading ? 'Confirmando...' : 'Confirmar agendamento'}
            </Button>

            <p className="text-center text-xs text-slate-400 leading-relaxed">
                Ao confirmar, você concorda em receber comunicações sobre seu agendamento.
            </p>
        </div>
    );
}

// ── Internal helper ───────────────────────────────────────────────────────────

interface ReviewRowProps {
    icon: React.ReactNode;
    label: string;
    onEdit: () => void;
    children: React.ReactNode;
}

function ReviewRow({ icon, label, onEdit, children }: ReviewRowProps) {
    return (
        <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="flex items-start gap-3 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {label}
                    </p>
                    {children}
                </div>
            </div>
            <button
                type="button"
                onClick={onEdit}
                aria-label={`Editar ${label}`}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors shrink-0 mt-1"
            >
                <Pencil size={11} />
                Alterar
            </button>
        </div>
    );
}
