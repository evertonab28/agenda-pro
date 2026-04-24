import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/route';
import CustomerForm from './Components/CustomerForm';

export default function Create() {
  return (
    <>
      <Head title="Novo Cliente - AgendaNexo" />

      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Link href={route('customers.index')}>
            <Button variant="ghost" className="pl-0 hover:bg-transparent group transition-all">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mr-3 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-[10px]">Voltar para Listagem</span>
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-primary/10 rounded-2xl shadow-inner shadow-primary/5">
               <UserPlus className="w-8 h-8 text-primary" />
             </div>
             <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Novo Cliente</h1>
          </div>
          <p className="text-muted-foreground font-medium ml-14">Cadastre um novo cliente para gerenciar agendamentos e cobranças.</p>
        </div>

        {/* Form Section */}
        <CustomerForm />
      </div>
    </>
  );
}

Create.layout = (page: any) => <AppLayout>{page}</AppLayout>;
