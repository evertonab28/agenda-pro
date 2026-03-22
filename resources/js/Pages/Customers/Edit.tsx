import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';
import CustomerForm from './Components/CustomerForm';

interface Props {
  customer: any;
}

export default function Edit({ customer }: Props) {
  return (
    <AppLayout>
      <Head title={`Editar ${customer.name} - Agenda Pro`} />

      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Link href={route('customers.show', customer.id)}>
            <Button variant="ghost" className="pl-0 hover:bg-transparent group transition-all">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mr-3 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-[10px]">Voltar para Perfil</span>
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-zinc-900 dark:bg-zinc-800 rounded-2xl shadow-inner shadow-zinc-200">
               <Edit2 className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Editar Cliente</h1>
          </div>
          <p className="text-muted-foreground font-medium ml-14 truncate max-w-lg">Atualizando o cadastro de <span className="text-primary font-bold">{customer.name}</span>.</p>
        </div>

        {/* Form Section */}
        <CustomerForm customer={customer} />
      </div>
    </AppLayout>
  );
}
