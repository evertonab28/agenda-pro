/**
 * Simple route helper for Ziggy-less environments
 */
export const route = (name: string, params?: any) => {
  const routes: any = {
    'dashboard': '/dashboard',
    'agenda': '/agenda',
    'agenda.store': '/agenda',
    'agenda.update': `/agenda/${params}`,
    'agenda.destroy': `/agenda/${params}`,
    'agenda.status': `/agenda/${params}/status`,
    'customers.index': '/customers',
    'customers.create': '/customers/create',
    'customers.store': '/customers',
    'customers.show': `/customers/${params}`,
    'customers.edit': `/customers/${params}/edit`,
    'customers.update': `/customers/${params}`,
    'customers.destroy': `/customers/${params}`,
    'customers.status': `/customers/${params}/status`,
  };
  
  return routes[name] || '#';
};
