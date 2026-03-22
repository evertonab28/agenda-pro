import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Edit2, Share2, MoreVertical, Calendar, DollarSign, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { route } from '@/lib/route';
import CustomerProfileHeader from './Components/CustomerProfileHeader';
import CustomerAppointmentsTable from './Components/CustomerAppointmentsTable';
import CustomerFinancialTable from './Components/CustomerFinancialTable';
import CustomerActivityTimeline from './Components/CustomerActivityTimeline';

interface Props {
  customer: any;
  summary: {
    total_paid: number;
    total_pending: number;
    total_overdue: number;
  };
  appointments: {
    data: any[];
    links: any[];
  };
  financial_history: {
    data: any[];
    links: any[];
  };
}

export default function Show({ customer, summary, appointments, financial_history }: Props) {
  return (
    <AppLayout>
      <Head title={`${customer.name} - Perfil do Cliente`} />

      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Navigation Breadcrumb-like Header */}
        <div className="flex items-center justify-between">
          <Link href={route('customers.index')}>
            <Button variant="ghost" className="pl-0 hover:bg-transparent group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mr-3 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-[10px]">Voltar para Listagem</span>
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-xl w-10 h-10 border-zinc-200 dark:border-zinc-800">
               <Share2 className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl w-10 h-10 border-zinc-200 dark:border-zinc-800">
               <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Profile Header & Financial Summary */}
        <CustomerProfileHeader customer={customer} summary={summary} />

        {/* Tabs Section for History & Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Tabs defaultValue="appointments" className="w-full">
              <TabsList className="bg-transparent h-12 p-0 gap-6 border-b border-zinc-100 dark:border-zinc-800 w-full justify-start rounded-none mb-6">
                <TabsTrigger 
                  value="appointments" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 font-bold text-sm text-muted-foreground transition-all"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendamentos
                </TabsTrigger>
                <TabsTrigger 
                  value="financial" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 font-bold text-sm text-muted-foreground transition-all"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Financeiro
                </TabsTrigger>
                <TabsTrigger 
                  value="details" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 font-bold text-sm text-muted-foreground transition-all"
                >
                  <History className="w-4 h-4 mr-2" />
                  Logs Detalhados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="appointments" className="mt-0 focus-visible:outline-none">
                <CustomerAppointmentsTable appointments={appointments} />
              </TabsContent>
              
              <TabsContent value="financial" className="mt-0 focus-visible:outline-none">
                <CustomerFinancialTable financialHistory={financial_history} />
              </TabsContent>

              <TabsContent value="details" className="mt-0 focus-visible:outline-none">
                 <div className="bg-white dark:bg-zinc-900 p-12 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                      <History className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Logs de Auditoria</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">Esta seção exibe todos os eventos técnicos e alterações de sistema vinculadas ao cliente.</p>
                 </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <CustomerActivityTimeline 
              appointments={appointments.data} 
              financialHistory={financial_history.data} 
              customer={customer} 
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
