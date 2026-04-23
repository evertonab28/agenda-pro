import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';

export type ThemePreset = 'slate' | 'ocean' | 'emerald' | 'violet' | 'mono';
export type ThemeMode = 'light' | 'dark' | 'system';

export function useAppearance() {
    const { auth } = usePage<any>().props;
    const mode = auth?.user?.theme_mode || 'system';
    const preset = auth?.user?.workspace?.theme_preset || 'slate';

    useEffect(() => {
        const applyTheme = () => {
            const doc = document.documentElement;
            
            // Apply Preset
            const themeClasses = Array.from(doc.classList).filter(c => c.startsWith('theme-'));
            themeClasses.forEach(c => doc.classList.remove(c));
            doc.classList.add(`theme-${preset}`);

            // Apply Mode
            if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                doc.classList.add('dark');
            } else {
                doc.classList.remove('dark');
            }
        };

        applyTheme();

        // Listen for system changes if in system mode
        if (mode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = () => applyTheme();
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
    }, [mode, preset]);

    const updateAppearance = (settings: { theme_preset?: ThemePreset; theme_mode?: ThemeMode }) => {
        router.patch(route('configuracoes.appearance.update'), settings, {
            preserveScroll: true,
        });
    };

    return {
        mode,
        preset,
        updateAppearance,
    };
}
