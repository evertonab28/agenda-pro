import React from 'react';
import { Star, Instagram } from 'lucide-react';

/**
 * Social proof placeholder.
 *
 * Sprint A: structural placeholder with skeleton cards.
 * Future sprint: replace with real Instagram feed / review integration.
 */
interface Props {
    workspace: Workspace;
}

export default function SocialProofSection({ workspace }: Props) {
    const instagramUrl = workspace.instagram_handle 
        ? `https://instagram.com/${workspace.instagram_handle.replace('@', '')}` 
        : null;

    return (
        <section className="bg-white border-t border-slate-100 py-14 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-start justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">O que nossos clientes dizem</h2>
                        <p className="text-slate-400 text-sm mt-1">Avaliações reais de quem já agendou</p>
                    </div>
                    {/* Instagram badge */}
                    {instagramUrl ? (
                        <a 
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors shrink-0 mt-1"
                        >
                            <Instagram size={14} />
                            <span>{workspace.instagram_handle}</span>
                        </a>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 mt-1">
                            <Instagram size={14} />
                            <span className="hidden sm:inline">Instagram em breve</span>
                        </div>
                    )}
                </div>

                {/* Skeleton placeholders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={13} className="fill-amber-300 text-amber-300" />
                                ))}
                            </div>
                            {/* Text skeleton */}
                            <div className="space-y-2">
                                <div className="h-3 bg-slate-200 rounded-full w-full" />
                                <div className="h-3 bg-slate-200 rounded-full w-4/5" />
                                <div className="h-3 bg-slate-200 rounded-full w-3/5" />
                            </div>
                            {/* Author skeleton */}
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-slate-200" />
                                <div className="h-2.5 w-20 bg-slate-200 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    {/* TODO Sprint B: integrate real testimonials or Instagram posts */}
                    Integração com avaliações reais em breve.
                </p>
            </div>
        </section>
    );
}
