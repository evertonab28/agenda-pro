import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import ConfigLayout from '@/Pages/Configurations/Layout';
import AppLayout from '@/Layouts/AppLayout';
import { useAppearance, ThemePreset, ThemeMode } from '@/Hooks/useAppearance';
import { Check, Sun, Moon, Monitor, Lock } from 'lucide-react';

const PRESETS = [
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
        <div className="space-y-10">
            <Head title="Aparência" />

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Tema do workspace</h2>
                    <p className="text-sm text-muted-foreground">Define a identidade visual da equipe.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {PRESETS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => canManageWorkspace && updateAppearance({ theme_preset: p.id as ThemePreset })}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${preset === p.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                        >
                            <div className="h-20 rounded-lg mb-3" style={{ background: p.colors.background, border: '1px solid var(--border)' }}>
                                <div className="h-full w-4 border-r border-border" style={{ background: p.colors.sidebar }} />
                            </div>
                            <p className="text-sm font-medium">{p.name}</p>
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Modo de exibição</h2>
                    <p className="text-sm text-muted-foreground">Afeta sua visualização individual.</p>
                </div>

                <div className="flex gap-4">
                    {['light', 'dark', 'system'].map((m) => (
                        <button
                            key={m}
                            onClick={() => updateAppearance({ theme_mode: m as ThemeMode })}
                            className={`flex-1 p-4 rounded-xl border-2 capitalize ${mode === m ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                        >
                            {m}
                        </button>
                    ))}
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
