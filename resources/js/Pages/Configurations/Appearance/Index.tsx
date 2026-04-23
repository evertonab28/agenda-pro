import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ConfigLayout from '@/Pages/Configurations/Layout';
import AppLayout from '@/Layouts/AppLayout';
import { useAppearance, ThemePreset, ThemeMode } from '@/Hooks/useAppearance';
import { Check, Sun, Moon, Monitor, Lock } from 'lucide-react';

interface PresetOption {
    id: ThemePreset;
    name: string;
    description: string;
    colors: {
        primary: string;
        background: string;
        card: string;
        sidebar: string;
    };
}

const PRESETS: PresetOption[] = [
    { id: 'slate', name: 'Slate', description: 'Profissional e neutro', colors: { primary: '#0f172a', background: '#f8fafc', card: '#ffffff', sidebar: '#ffffff' } },
    { id: 'ocean', name: 'Ocean', description: 'Azul tecnológico', colors: { primary: '#0284c7', background: '#f0f9ff', card: '#ffffff', sidebar: '#f0f9ff' } },
    { id: 'emerald', name: 'Emerald', description: 'Verde sofisticado', colors: { primary: '#059669', background: '#f0fdf4', card: '#ffffff', sidebar: '#f0fdf4' } },
    { id: 'violet', name: 'Violet', description: 'Moderno e premium', colors: { primary: '#7c3aed', background: '#f5f3ff', card: '#ffffff', sidebar: '#f5f3ff' } },
    { id: 'mono', name: 'Mono', description: 'Minimalista puro', colors: { primary: '#18181b', background: '#fafafa', card: '#ffffff', sidebar: '#ffffff' } },
];

export default function AppearanceIndex() {
    const { preset, mode, updateAppearance } = useAppearance();
    const { props } = usePage<any>();
    const canManageWorkspace = props?.auth?.can?.manage_settings ?? false;

    return (
        <div className="space-y-12">
            <Head title="Aparência" />

            {/* Bloco 1: Tema do Workspace */}
            <section className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Tema do workspace</h2>
                    <p className="text-muted-foreground text-sm">
                        Define a identidade visual usada por toda a equipe no sistema.
                    </p>
                    {!canManageWorkspace && (
                        <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-900/50 w-fit">
                            <Lock className="w-3.5 h-3.5" />
                            Apenas administradores podem alterar o tema
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {PRESETS.map((p) => (
                        <button
                            key={p.id}
                            disabled={!canManageWorkspace}
                            onClick={() => updateAppearance({ theme_preset: p.id as ThemePreset })}
                            className={`
                                relative flex flex-col group text-left transition-all duration-300
                                ${!canManageWorkspace ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1.5'}
                            `}
                        >
                            <div className={`
                                aspect-[4/3] rounded-2xl border-2 overflow-hidden transition-all duration-300 shadow-sm
                                ${preset === p.id 
                                    ? 'border-primary ring-4 ring-primary/15 shadow-xl shadow-primary/10' 
                                    : 'border-border group-hover:border-primary/50 group-hover:shadow-md'
                                }
                            `}>
                                {/* Mini Preview UI */}
                                <div className="flex h-full w-full" style={{ background: p.colors.background }}>
                                    {/* Sidebar */}
                                    <div className="w-1/4 h-full border-r border-border/60" style={{ background: p.colors.sidebar }}>
                                        <div className="p-2 space-y-2">
                                            <div className="h-2 w-full rounded-full opacity-60" style={{ background: p.colors.primary }}></div>
                                            <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/15"></div>
                                            <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/15"></div>
                                        </div>
                                    </div>
                                    {/* Content Area */}
                                    <div className="flex-1 p-3 space-y-3">
                                        <div className="h-2 w-1/3 rounded-full bg-muted-foreground/25"></div>
                                        <div className="h-14 rounded-xl border-2 border-border/40 shadow-lg flex flex-col p-2 gap-2" style={{ background: p.colors.card }}>
                                            <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/15"></div>
                                            <div className="mt-auto flex justify-end">
                                                <div className="h-4 w-10 rounded-md shadow-md" style={{ background: p.colors.primary }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 px-1 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className={`text-sm font-extrabold transition-colors ${preset === p.id ? 'text-primary' : 'text-foreground'}`}>
                                        {p.name}
                                    </span>
                                    <span className="text-[11px] font-medium text-muted-foreground line-clamp-1">{p.description}</span>
                                </div>
                                {preset === p.id && (
                                    <div className="bg-primary text-primary-foreground rounded-full p-0.5 ring-2 ring-background shadow-lg">
                                        <Check className="w-3.5 h-3.5" strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Bloco 2: Seu modo de exibição */}
            <section className="space-y-6 pt-8 border-t border-border">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Seu modo de exibição</h2>
                    <p className="text-muted-foreground text-sm">Personalize como o sistema aparece apenas para você.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    {[
                        { id: 'light', name: 'Claro', icon: Sun },
                        { id: 'dark', name: 'Escuro', icon: Moon },
                        { id: 'system', name: 'Sistema', icon: Monitor },
                    ].map((m) => {
                        const Icon = m.icon;
                        const active = mode === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => updateAppearance({ theme_mode: m.id as ThemeMode })}
                                className={`
                                    flex-1 min-w-[140px] p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group
                                    ${active 
                                        ? 'border-primary bg-primary/[0.05] text-primary shadow-xl shadow-primary/5 ring-4 ring-primary/10 scale-[1.02]' 
                                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30'
                                    }
                                `}
                            >
                                <div className={`
                                    p-4 rounded-2xl transition-all duration-300 shadow-sm
                                    ${active ? 'bg-primary text-primary-foreground rotate-0 scale-110 shadow-lg' : 'bg-muted/80 group-hover:bg-primary/15 group-hover:text-primary group-hover:scale-105'}
                                `}>
                                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-black tracking-widest uppercase">{m.name}</span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

AppearanceIndex.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Aparência">
            {page}
        </ConfigLayout>
    </AppLayout>
);
