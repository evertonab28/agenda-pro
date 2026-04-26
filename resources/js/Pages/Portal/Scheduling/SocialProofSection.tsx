import React from 'react';
import { Star, Instagram, Award, ShieldCheck, Heart, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Workspace } from './types';

interface Props {
    workspace: Workspace;
}

export default function SocialProofSection({ workspace }: Props) {
    const instagramUrl = workspace.instagram_handle 
        ? `https://instagram.com/${workspace.instagram_handle.replace('@', '')}` 
        : null;

    const badges = [
        { icon: <Award size={18} />, label: 'Qualidade Elite' },
        { icon: <ShieldCheck size={18} />, label: 'Ambiente Seguro' },
        { icon: <Heart size={18} />, label: 'Foco no Cliente' },
        { icon: <Sparkles size={18} />, label: 'Resultados VIP' },
    ];

    return (
        <section className="bg-white border-t border-slate-100 py-20 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {[...Array(5)].map((_, j) => (
                            <Star key={j} size={16} className="fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                        Compromisso com sua satisfação
                    </h2>
                    <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
                        Nossa prioridade é oferecer uma experiência única e resultados que superem suas expectativas. 
                        Junte-se aos centenas de clientes que confiam no nosso trabalho.
                    </p>
                </div>

                {/* Instagram Hub Card */}
                {instagramUrl ? (
                    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-12 shadow-2xl mb-16">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Instagram size={200} />
                        </div>
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                                    <Instagram size={14} className="text-pink-400" />
                                    <span>Social Hub</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                    Confira nosso trabalho no Instagram
                                </h3>
                                <p className="text-slate-300 text-sm mb-8 leading-relaxed max-w-sm">
                                    Acompanhe nosso dia a dia, resultados de clientes e novidades em tempo real. Siga nosso perfil oficial.
                                </p>
                                <a 
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl text-sm font-black hover:bg-indigo-50 transition-all group"
                                >
                                    <span>@{workspace.instagram_handle.replace('@', '')}</span>
                                    <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
                                    <p className="text-2xl font-black text-white mb-1">100%</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digital</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
                                    <p className="text-2xl font-black text-white mb-1">Elite</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Padrão</p>
                                </div>
                                <div className="col-span-2 bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
                                    <span className="text-sm font-bold text-indigo-200">Pronto para agendar?</span>
                                    <Star size={18} className="text-amber-400 fill-amber-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-3xl p-10 text-center border border-slate-100 mb-16">
                         <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Star size={32} className="text-amber-400 fill-amber-400" />
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 mb-2">Qualidade Garantida</h3>
                         <p className="text-slate-500 text-sm max-w-sm mx-auto">
                            Oferecemos o melhor atendimento da região com profissionais qualificados.
                         </p>
                    </div>
                )}

                {/* Trust Badges Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-t border-slate-50">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="flex items-center justify-center md:justify-start gap-4 text-slate-400 group cursor-default">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                {badge.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                                {badge.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-14">
                    <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
                        Incentivamos nossos clientes a compartilharem sua experiência. 
                        Use a hashtag <span className="text-indigo-400 font-bold">#{workspace.slug}</span> em sua próxima visita!
                    </p>
                </div>
            </div>
        </section>
    );
}
