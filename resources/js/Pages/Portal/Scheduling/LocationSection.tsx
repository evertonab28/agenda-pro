import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import type { Workspace } from './types';

interface Props {
    workspace: Workspace;
}

/**
 * Location and hours placeholder.
 *
 * Sprint A: structural block with placeholders for address and map.
 * Future sprint: connect to workspace address fields + embed map.
 */
export default function LocationSection({ workspace }: Props) {
    if (!workspace.show_location) return null;

    const hasAddress = workspace.address_street && workspace.address_city;
    const fullAddress = [
        workspace.address_street,
        workspace.address_number,
        workspace.address_complement,
        workspace.address_district,
        workspace.address_city,
        workspace.address_state,
    ].filter(Boolean).join(', ');

    return (
        <section className="bg-slate-50 border-t border-slate-100 py-14 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    {/* Info */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Onde nos encontrar</h2>
                        <div className="space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <MapPin size={16} className="text-indigo-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{workspace.public_name || workspace.name}</p>
                                    <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">
                                        {hasAddress ? fullAddress : 'Consulte nosso endereço completo entrando em contato.'}
                                        {workspace.address_zip && <span className="block">CEP: {workspace.address_zip}</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <Clock size={16} className="text-indigo-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">Horário de funcionamento</p>
                                    <p className="text-sm text-slate-400 mt-0.5">
                                        Consulte os horários disponíveis ao iniciar seu agendamento
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map placeholder */}
                    <div className="h-52 bg-slate-200 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <MapPin size={28} className="text-slate-300" />
                        <span className="text-xs font-medium uppercase tracking-widest">
                            {hasAddress ? 'Mapa disponível em breve' : 'Localização no mapa'}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
