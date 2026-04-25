import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Clock, RotateCcw, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Workspace, Customer, Service, Professional, BookingFormData } from './types';

interface Props {
    workspace: Workspace;
    service: Service | null;
    addons?: Service[];
    professional: Professional | null;
    date: Date;
    slot: string | null;
    customer?: Customer;
    formData: BookingFormData;
}

export default function BookingSuccess({
    workspace,
    service,
    addons = [],
    professional,
    date,
    slot,
    customer,
    formData,
}: Props) {
    const identifier = formData.phone || formData.email || '';

    return (
        <div className="flex flex-col items-center text-center py-12 px-4 space-y-8 animate-in zoom-in-95 duration-500">
            {/* Icon */}
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-green-500" />
            </div>

            {/* Heading */}
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Agendamento confirmado!</h2>
                <p className="text-slate-500 mt-2 text-sm">
                    Guarde as informações abaixo para referência.
                </p>
            </div>

            {/* Summary card */}
            <div className="w-full max-w-sm bg-white border border-slate-100 rounded-2xl shadow-sm text-left overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {workspace.name}
                    </p>
                </div>

                <div className="px-5 py-4 space-y-4">
                    {service && (
                        <Row label="Serviço principal" value={service.name} />
                    )}
                    {addons.length > 0 && (
                        <Row 
                            label="Adicionais" 
                            value={addons.map(a => a.name).join(', ')} 
                        />
                    )}
                    {professional && (
                        <Row label="Profissional" value={professional.name} />
                    )}
                    {slot && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                Data e horário
                            </p>
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                                <Calendar size={14} className="text-indigo-500" />
                                <span className="capitalize">
                                    {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-0.5 ml-0.5">
                                <Clock size={14} className="text-slate-400" />
                                <span>às {slot}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                        const dest = customer
                            ? `/p/${workspace.slug}/dashboard`
                            : `/p/${workspace.slug}/login${identifier ? `?identifier=${encodeURIComponent(identifier)}` : ''}`;
                        window.location.href = dest;
                    }}
                >
                    <UserCircle size={16} />
                    Minha área
                </Button>
                <Button
                    className="flex-1 gap-2"
                    onClick={() => window.location.reload()}
                >
                    <RotateCcw size={16} />
                    Novo agendamento
                </Button>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}
