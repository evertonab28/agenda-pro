import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ConfigLayout from '@/Pages/Configurations/Layout';
import AppLayout from '@/Layouts/AppLayout';
import { useAppearance, ThemePreset, ThemeMode } from '@/Hooks/useAppearance';
import { Check, Sun, Moon, Monitor, Lock, Palette, MonitorSmartphone } from 'lucide-react';
import { SectionCard } from '@/components/Shared/SectionCard';

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
    { id: 'slate', name: 'Slate', description: 'Profissional e neutro', colors: { primary: '#2563eb', background: '#f8fafc', card: '#ffffff', sidebar: '#1e293b' } },
    { id: 'ocean', name: 'Ocean', description: 'Azul tecnológico', colors: { primary: '#0284c7', background: '#f0f9ff', card: '#ffffff', sidebar: '#082f49' } },
    { id: 'emerald', name: 'Emerald', description: 'Verde sofisticado', colors: { primary: '#059669', background: '#f0fdf4', card: '#ffffff', sidebar: '#064e3b' } },
    { id: 'violet', name: 'Violet', description: 'Moderno e premium', colors: { primary: '#7c3aed', background: '#f5f3ff', card: '#ffffff', sidebar: '#2e1066' } },
    { id: 'mono', name: 'Mono', description: 'Minimalista puro', colors: { primary: '#18181b', background: '#f4f4f5', card: '#ffffff', sidebar: '#09090b' } },
];

export default function AppearanceIndex() {
    const { preset, mode, updateAppearance } = useAppearance();
    const { props } = usePage<any>();
    const canManageWorkspace = props?.auth?.can?.manage_settings ?? false;

    return (
        <>
            <Head title="Aparência - Configurações" />
            
            <div className="max-w-6xl space-y-8">
                {/* Tema do Workspace */}
                <SectionCard 
                    title="Identidade Visual do Workspace" 
                    subtitle="Defina as cores globais que representam sua marca em todo o sistema."
                >
                    <div className="space-y-8 py-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/20 rounded-2xl border border-border/40">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-black text-foreground tracking-tight uppercase text-xs">Paleta de Cores Coletiva</h4>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Afeta todos os usuários do ambiente</p>
                                </div>
                            </div>
                            {!canManageWorkspace && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning-bg/50 text-warning-text text-[10px] font-black uppercase tracking-widest border border-warning/20 shadow-sm">
                                    <Lock className="w-3.5 h-3.5" />
                                    Apenas administradores podem alterar
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
                                            : 'border-border/60 group-hover:border-primary/50 group-hover:shadow-md'
                                        }
                                    `}>
                                        <div className="flex h-full w-full" style={{ background: p.colors.background }}>
                                            <div className="w-1/4 h-full border-r border-border/40" style={{ background: p.colors.sidebar }}>
                                                <div className="p-2 space-y-1.5">
                                                    <div className="h-1.5 w-full rounded-full opacity-60" style={{ background: p.colors.primary }}></div>
                                                    <div className="h-1 w-2/3 rounded-full bg-muted-foreground/10"></div>
                                                    <div className="h-1 w-3/4 rounded-full bg-muted-foreground/10"></div>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-2 space-y-2">
                                                <div className="h-1.5 w-1/3 rounded-full bg-muted-foreground/20"></div>
                                                <div className="h-10 rounded-lg border border-border/20 shadow-sm flex flex-col p-1.5 gap-1.5" style={{ background: p.colors.card }}>
                                                    <div className="h-1 w-1/2 rounded-full bg-muted-foreground/10"></div>
                                                    <div className="mt-auto flex justify-end">
                                                        <div className="h-2.5 w-6 rounded-sm shadow-sm" style={{ background: p.colors.primary }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 px-1 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${preset === p.id ? 'text-primary' : 'text-foreground'}`}>
                                                {p.name}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase text-muted-foreground opacity-60 tracking-wider mt-0.5">{p.description}</span>
                                        </div>
                                        {preset === p.id && (
                                            <div className="bg-primary text-white rounded-full p-0.5 shadow-lg shadow-primary/20">
                                                <Check className="w-3 h-3" strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </SectionCard>

                {/* Seu modo de exibição */}
                <SectionCard 
                    title="Configurações de Exibição" 
                    subtitle="Ajuste como o sistema aparece apenas para você."
                >
                    <div className="space-y-6 py-2">
                        <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl border border-border/40 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-info-bg/10 flex items-center justify-center text-info-text">
                                <MonitorSmartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-foreground tracking-tight uppercase text-xs">Modo de Interface</h4>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Sua preferência pessoal de conforto</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: 'light', name: 'Modo Claro', icon: Sun, desc: 'Brilho padrão para o dia' },
                                { id: 'dark', name: 'Modo Escuro', icon: Moon, desc: 'Conforto para olhos cansados' },
                                { id: 'system', name: 'Automático', icon: Monitor, desc: 'Segue as cores do seu sistema' },
                            ].map((m) => {
                                const Icon = m.icon;
                                const active = mode === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => updateAppearance({ theme_mode: m.id as ThemeMode })}
                                        className={`
                                            p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group text-center
                                            ${active 
                                                ? 'border-primary bg-primary/[0.03] text-primary shadow-xl shadow-primary/5' 
                                                : 'border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/20'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            p-4 rounded-2xl transition-all duration-300 shadow-sm
                                            ${active ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-muted/80 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105'}
                                        `}>
                                            <Icon className="w-7 h-7" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-black tracking-widest uppercase block">{m.name}</span>
                                            <span className="text-[9px] font-bold uppercase opacity-50 tracking-wider mt-1 block">{m.desc}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}

AppearanceIndex.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Aparência Customizada">
            {page}
        </ConfigLayout>
    </AppLayout>
);
