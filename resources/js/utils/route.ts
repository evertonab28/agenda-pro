/**
 * Simple route helper for the frontend when Ziggy is not globally registered.
 * Maps dynamic route names to their respective URL paths.
 */
const routes: Record<string, string> = {
    'dashboard': '/dashboard',
    'agenda': '/agenda',
    'agenda.store': '/agenda',
    'customers.index': '/customers',
    'customers.create': '/customers/create',
    'customers.store': '/customers',
    'finance.dashboard': '/financeiro',
    'finance.charges.index': '/financeiro/cobrancas',
    'finance.charges.create': '/financeiro/cobrancas/create',
    'finance.charges.store': '/financeiro/cobrancas',
    'finance.charges.export': '/financeiro/cobrancas/exportar',
};

export function route(name: string, params?: any): string {
    let url = routes[name] || '#';

    if (params) {
        if (typeof params === 'object') {
            Object.keys(params).forEach(key => {
                url = url.replace(`:${key}`, params[key]);
            });
        } else {
            // Assume it's a single ID if not an object
            url = url.replace(/:id|:charge/, params);
        }
    }

    // Add dynamic route patterns if needed
    if (name === 'finance.charges.show') return `/financeiro/cobrancas/${params?.id || params}`;
    if (name === 'finance.charges.edit') return `/financeiro/cobrancas/${params?.id || params}/edit`;
    if (name === 'finance.charges.update') return `/financeiro/cobrancas/${params?.id || params}`;
    if (name === 'finance.charges.destroy') return `/financeiro/cobrancas/${params?.id || params}`;
    if (name === 'finance.charges.receive') return `/financeiro/cobrancas/${params?.id || params}/receber`;
    
    if (name === 'agenda.update') return `/agenda/${params?.id || params}`;
    if (name === 'agenda.destroy') return `/agenda/${params?.id || params}`;
    if (name === 'agenda.status') return `/agenda/${params?.id || params}/status`;
    
    if (name === 'customers.show') return `/customers/${params?.id || params}`;
    if (name === 'customers.edit') return `/customers/${params?.id || params}/edit`;
    if (name === 'customers.update') return `/customers/${params?.id || params}`;
    if (name === 'customers.destroy') return `/customers/${params?.id || params}`;
    if (name === 'customers.status') return `/customers/${params?.id || params}/status`;

    return url;
}
