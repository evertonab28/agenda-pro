import React from 'react';
import { Star, Instagram, Award, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Workspace } from './types';

interface Props {
    workspace: Workspace;
}

export default function SocialProofSection({ workspace }: Props) {
    const instagramUrl = workspace.instagram_handle 
        ? `https://instagram.com/${workspace.instagram_handle.replace('@', '')}` 
        : null;

    // Premium assets generated for the workspace
    const highlights = [
        {
            id: 1,
            image: '/Users/evertonab/.gemini/antigravity/brain/da6cadbf-a0e4-49da-ae41-e8ae5a585692/instagram_post_1_1777087544459.png',
            caption: 'Nosso espaço pensado em você'
        },
        {
            id: 2,
            image: '/Users/evertonab/.gemini/antigravity/brain/da6cadbf-a0e4-49da-ae41-e8ae5a585692/instagram_post_2_1777087557807.png',
            caption: 'Excelência em cada detalhe'
        },
        {
            id: 3,
            image: '/Users/evertonab/.gemini/antigravity/brain/da6cadbf-a0e4-49da-ae41-e8ae5a585692/instagram_post_3_1777087570545.png',
            caption: 'Experiência relaxante e única'
        }
    ];

    const badges = [
        { icon: <Award size={18} />, label: 'Qualidade Elite' },
        { icon: <ShieldCheck size={18} />, label: 'Ambiente Seguro' },
        { icon: <Heart size={18} />, label: 'Foco no Cliente' },
        { icon: <Sparkles size={18} />, label: 'Resultados VIP' },
    ];

    return (
        <section className="bg-white border-t border-slate-100 py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-10 gap-6 text-center md:text-left">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            {[...Array(5)].map((_, j) => (
                                <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                            ))}
                            <span className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">
                                Excelência comprovada
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            {instagramUrl ? 'Siga nosso Instagram' : 'Conheça nosso trabalho'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1 max-w-md">
                            Acompanhe os bastidores e os resultados incríveis de quem confia no {workspace.name}.
                        </p>
                    </div>

                    {instagramUrl && (
                        <a 
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200"
                        >
                            <Instagram size={18} className="group-hover:scale-110 transition-transform" />
                            <span>@{workspace.instagram_handle.replace('@', '')}</span>
                        </a>
                    )}
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    {highlights.map((post) => (
                        <div key={post.id} className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                            <img 
                                src={post.image} 
                                alt={post.caption}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                <div className="flex items-center gap-2 text-white/80 text-xs font-medium mb-1">
                                    <Instagram size={14} />
                                    <span>Ver post completo</span>
                                </div>
                                <p className="text-white text-sm font-semibold leading-tight">
                                    {post.caption}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust Badges Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-slate-50">
                    {badges.map((badge, idx) => (
                        <div key={idx} className="flex items-center justify-center md:justify-start gap-3 text-slate-400 group cursor-default">
                            <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                {badge.icon}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                                {badge.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-10">
                    <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
                        Incentivamos nossos clientes a compartilharem sua experiência. 
                        Use a hashtag <span className="text-indigo-400 font-bold">#{workspace.slug}</span> em sua próxima visita!
                    </p>
                </div>
            </div>
        </section>
    );
}
