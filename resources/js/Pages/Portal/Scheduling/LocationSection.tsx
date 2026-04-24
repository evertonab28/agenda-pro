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
                                    <p className="font-semibold text-slate-800 text-sm">{workspace.name}</p>
                                    <p className="text-sm text-slate-400 mt-0.5">
                                        {/* TODO Sprint B: add address field to workspace settings */}
                                        Endereço não configurado · Configure no painel
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
                                        {/* TODO Sprint B: read from professional schedules aggregate */}
                                        Consulte os horários disponíveis no agendamento
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map placeholder */}
                    <div className="h-52 bg-slate-200 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <MapPin size={28} className="text-slate-300" />
                        <span className="text-sm">
                            {/* TODO Sprint B: embed Google Maps or Mapbox */}
                            Mapa será integrado em breve
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
