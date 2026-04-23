<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AgendaNexo</title>
@routes
@viteReactRefresh
@vite(['resources/css/app.css', 'resources/js/app.tsx'])
@inertiaHead
    <script>
        (function() {
            try {
                const mode = "{{ Auth::user()?->theme_mode ?? 'system' }}";
                const preset = "{{ Auth::user()?->workspace?->theme_preset ?? 'slate' }}";
                const doc = document.documentElement;
                
                // Limpar classes de tema anteriores se houver
                const themeClasses = Array.from(doc.classList).filter(c => c.startsWith('theme-'));
                themeClasses.forEach(c => doc.classList.remove(c));
                
                doc.classList.add('theme-' + preset);
                
                if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    doc.classList.add('dark');
                } else {
                    doc.classList.remove('dark');
                }
            } catch (e) {}
        })();
    </script>
</head>
<body class="antialiased">
@inertia
</body>
</html>