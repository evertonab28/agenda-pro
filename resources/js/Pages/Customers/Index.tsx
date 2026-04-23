import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Plus, Users, UserPlus, TrendingUp, Heart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomerFilters from './Components/CustomerFilters';
import CustomersTable from './Components/CustomersTable';
import Pagination from '@/components/Pagination';
import { route } from '@/lib/route';
import { PageHeader } from '@/Components/Shared/PageHeader';
import { SectionCard } from '@/Components/Shared/SectionCard';
import { MetricCard } from '@/Components/Shared/MetricCard';

interface Props {
  customers: {
    data: any[];
    links: any[];
    total: number;
  };
  filters: any;
  stats: {
    growth: number;
    retention: number;
    total_active: number;
  };
}

export default function Index({ customers, filters, stats }: Props) {
  return (
    <>
      <Head title="Gerenciamento de Clientes" />
      
      <div className="space-y-6">
        <PageHeader 
          title="Clientes"
          subtitle={
            <div className="flex items-center gap-2">
              Gerencie sua base de clientes e histórico operacional
              <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
              <span className="text-primary font-bold">{customers.total} encontrados</span>
            </div>
          }
          action={
            <Link href={route('customers.create')}>
               <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                 <UserPlus className="w-4 h-4 mr-2" />
                 Novo Cliente
               </Button>
            </Link>
          }
        />

        {/* Quick Stats/Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            label="Satisfação & Crescimento"
            value={`${stats.growth}%`}
            sub={stats.growth >= 0 ? 'Crescimento constante na base' : 'Ritmo de atenção na base'}
            icon={<TrendingUp className="w-5 h-5" />}
            color="var(--primary)"
            delta={{ absolute: stats.growth, percentage: stats.growth }}
          />
          
          <MetricCard
            label="Taxa de Retenção"
            value={`${stats.retention}%`}
            sub={stats.retention > 50 ? 'Fidelidade alta dos clientes' : 'Fidelidade em construção'}
            icon={<Heart className="w-5 h-5" />}
            color="var(--success-text)"
          />

          <MetricCard
            label="Clientes Ativos"
            value={stats.total_active}
            sub="Operação ativa no momento"
            icon={<Activity className="w-5 h-5" />}
            color="var(--warning-text)"
          />
        </div>

        {/* Filters Section */}
        <CustomerFilters filters={filters} />

        {/* Table Section */}
        <SectionCard 
          noPadding 
          title="Listagem de Clientes"
          footer={
            <div className="flex justify-center">
              <Pagination links={customers.links} />
            </div>
          }
        >
          <CustomersTable customers={customers} />
        </SectionCard>
      </div>
    </>
  );
}

Index.layout = (page: any) => <AppLayout children={page} />;
