import './bootstrap';
import '../css/app.css'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import { route } from 'ziggy-js'

createInertiaApp({
resolve: (name) =>
resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
setup({ el, App, props }) {
    // @ts-expect-error
    window.route = route;
    createRoot(el).render(<App {...props} />)
},
progress: {
color: '#2563eb',
},
})
