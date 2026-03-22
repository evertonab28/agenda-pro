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
    'configuracoes.index': '/configuracoes',
    'configuracoes.services.index': '/configuracoes/servicos',
    'configuracoes.services.create': '/configuracoes/servicos/create',
    'configuracoes.services.store': '/configuracoes/servicos',
    'configuracoes.professionals.index': '/configuracoes/profissionais',
    'configuracoes.professionals.create': '/configuracoes/profissionais/create',
    'configuracoes.professionals.store': '/configuracoes/profissionais',
    'configuracoes.schedules.index': '/configuracoes/horarios',
    'configuracoes.schedules.store': '/configuracoes/horarios',
    'configuracoes.holidays.index': '/configuracoes/feriados',
    'configuracoes.holidays.store': '/configuracoes/feriados',
    'configuracoes.general.index': '/configuracoes/geral',
    'configuracoes.general.store': '/configuracoes/geral',
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

    if (name === 'configuracoes.services.show') return `/configuracoes/servicos/${params?.id || params}`;
    if (name === 'configuracoes.services.edit') return `/configuracoes/servicos/${params?.id || params}/edit`;
    if (name === 'configuracoes.services.update') return `/configuracoes/servicos/${params?.id || params}`;
    if (name === 'configuracoes.services.destroy') return `/configuracoes/servicos/${params?.id || params}`;

    if (name === 'configuracoes.professionals.show') return `/configuracoes/profissionais/${params?.id || params}`;
    if (name === 'configuracoes.professionals.edit') return `/configuracoes/profissionais/${params?.id || params}/edit`;
    if (name === 'configuracoes.professionals.update') return `/configuracoes/profissionais/${params?.id || params}`;
    if (name === 'configuracoes.professionals.destroy') return `/configuracoes/profissionais/${params?.id || params}`;

    if (name === 'configuracoes.holidays.show') return `/configuracoes/feriados/${params?.id || params}`;
    if (name === 'configuracoes.holidays.edit') return `/configuracoes/feriados/${params?.id || params}/edit`;
    if (name === 'configuracoes.holidays.update') return `/configuracoes/feriados/${params?.id || params}`;
    if (name === 'configuracoes.holidays.destroy') return `/configuracoes/feriados/${params?.id || params}`;

    return url;
}
