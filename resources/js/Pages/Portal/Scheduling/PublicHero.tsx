import React from 'react';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Workspace } from './types';

interface Props {
    workspace: Workspace;
    onBookNow: () => void;
}

export default function PublicHero({ workspace, onBookNow }: Props) {
    return (
        <section className="bg-white border-b border-slate-100 py-16 md:py-24 px-4">
            <div className="max-w-5xl mx-auto text-center">
                {/* Availability badge */}
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    Agendamento online disponível
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-5">
                    {workspace.public_name || workspace.name}
                </h1>

                <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-lg mx-auto leading-relaxed">
                    {workspace.public_description || 'Escolha seu serviço, profissional e horário preferido. Rápido, fácil e sem ligações.'}
                </p>

                <Button
                    onClick={onBookNow}
                    className="h-12 px-8 text-base font-semibold gap-2 shadow-lg shadow-indigo-200"
                >
                    <CalendarCheck size={18} />
                    Agendar agora
                </Button>
            </div>
        </section>
    );
}
