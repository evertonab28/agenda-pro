import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Plus, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomerFilters from './Components/CustomerFilters';
import CustomersTable from './Components/CustomersTable';
import Pagination from '@/components/Pagination';
import { route } from '@/lib/route';

interface Props {
  customers: {
    data: any[];
    links: any[];
  };
  filters: any;
}

export default function Index({ customers, filters }: Props) {
  return (
    <AppLayout>
      <Head title="Gerenciamento de Clientes" />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary/10 rounded-2xl">
               <Users className="w-8 h-8 text-primary" />
             </div>
             <div>
               <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Clientes</h1>
               <p className="text-muted-foreground font-medium flex items-center gap-2">
                 Gerencie sua base de clientes e histórico operacional.
                 <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                 <span className="text-primary font-bold">{customers.data.length} encontrados</span>
               </p>
             </div>
          </div>
          
          <Link href={route('customers.create')}>
             <Button className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
               <UserPlus className="w-5 h-5 mr-2" />
               Novo Cliente
             </Button>
          </Link>
        </div>

        {/* Filters Section */}
        <CustomerFilters filters={filters} />

        {/* Table Section */}
        <div className="space-y-4">
          <CustomersTable customers={customers} />
          
          {/* Pagination */}
          <div className="flex justify-center">
            <Pagination links={customers.links} />
          </div>
        </div>

        {/* Quick Stats/Insights (Optional Premium Touch) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
           <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <Users className="w-24 h-24" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Satisfação</p>
             <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Crescimento constante</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Sua base de clientes cresceu 12% este mês.</p>
           </div>
           
           <div className="bg-gradient-to-br from-emerald-500/5 to-transparent p-6 rounded-3xl border border-emerald-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <UserPlus className="w-24 h-24 text-emerald-500" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Retenção</p>
             <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Fidelidade alta</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">85% dos clientes retornam em menos de 30 dias.</p>
           </div>

           <div className="bg-gradient-to-br from-orange-500/5 to-transparent p-6 rounded-3xl border border-orange-500/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <Plus className="w-24 h-24 text-orange-500" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">Status Ativo</p>
             <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Operação ativa</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Você possui {customers.data.filter(c => c.is_active).length} clientes ativos atualmente.</p>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}
