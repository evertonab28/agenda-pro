import React from 'react';
import { MapPin, Clock, Map as MapIcon, ChevronRight } from 'lucide-react';
import type { Workspace, OpeningHours } from './types';

interface Props {
    workspace: Workspace;
    openingHours?: OpeningHours;
}

const WEEKDAYS = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
];

export default function LocationSection({ workspace, openingHours }: Props) {
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

    const mapQuery = encodeURIComponent(fullAddress || workspace.name);
    const googleMapsUrl = `https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_API_KEY&q=${mapQuery}`;
    
    // NOTE: In a real production app, we'd use a real API key. 
    // For now, we can use the search URL or a generic embed if allowed.
    // Actually, I'll use a standard Google Maps Search link if I can't do an embed without a key.
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    return (
        <section className="bg-slate-50 border-t border-slate-100 py-20 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Info */}
                    <div className="space-y-10">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Onde nos encontrar</h2>
                            
                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                        <MapPin size={20} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-base">{workspace.public_name || workspace.name}</p>
                                        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xs">
                                            {hasAddress ? fullAddress : 'Consulte nosso endereço completo entrando em contato.'}
                                            {workspace.address_zip && <span className="block mt-1 font-medium">CEP: {workspace.address_zip}</span>}
                                        </p>
                                        {hasAddress && (
                                            <a 
                                                href={searchUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-widest mt-4 hover:text-indigo-800 transition-colors"
                                            >
                                                Ver no Google Maps
                                                <ChevronRight size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                        <Clock size={20} className="text-indigo-500" />
                                    </div>
                                    <div className="w-full">
                                        <p className="font-bold text-slate-900 text-base mb-3">Horário de funcionamento</p>
                                        
                                        {openingHours && Object.keys(openingHours).length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {Object.entries(openingHours).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([day, schedule]: [string, any]) => (
                                                    <div key={day} className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0">
                                                        <span className="text-sm font-medium text-slate-600">{WEEKDAYS[parseInt(day)]}</span>
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {schedule.start_time.substring(0, 5)} — {schedule.end_time.substring(0, 5)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400">
                                                Consulte os horários disponíveis ao iniciar seu agendamento.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-indigo-500/5 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative h-[400px] w-full bg-slate-200 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
                            {hasAddress ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 p-8 text-center">
                                    <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-2">
                                        <MapIcon size={40} className="text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-600">Mapa Indisponível</p>
                                        <p className="text-xs font-medium uppercase tracking-widest mt-1">Configure um endereço válido</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
