import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Calendar, FileText, UserCheck, UserMinus, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  customer: any;
  summary: {
    total_paid: number;
    total_pending: number;
    total_overdue: number;
  };
}

export default function CustomerProfileHeader({ customer, summary }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        
        <div className="flex flex-col md:flex-row gap-8 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary to-primary-foreground/20 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            {customer.is_active ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1 px-4 rounded-full">
                <UserCheck className="w-3 h-3 mr-1.5" /> Ativo
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-zinc-100 text-zinc-600 border-zinc-200 py-1 px-4 rounded-full">
                <UserMinus className="w-3 h-3 mr-1.5" /> Inativo
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{customer.name}</h1>
                <p className="text-muted-foreground font-medium mt-1">Cliente desde {format(parseISO(customer.created_at), 'MMMM yyyy', { locale: ptBR })}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl border-zinc-200 h-11 px-6 font-bold hover:bg-zinc-50 transition-all">Editar Perfil</Button>
                <Button className="rounded-xl h-11 px-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">Novo Agendamento</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefone</p>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">{customer.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">{customer.email || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documento (CPF/CNPJ)</p>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">{customer.document || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[2rem] border-zinc-100 dark:border-zinc-800 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center gap-6 relative overflow-hidden group border-l-8 border-l-emerald-500">
          <div className="p-4 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-emerald-600 tracking-widest">Total Pago</p>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(summary.total_paid)}</h4>
          </div>
        </Card>

        <Card className="p-6 rounded-[2rem] border-zinc-100 dark:border-zinc-800 bg-orange-500/5 dark:bg-orange-500/10 flex items-center gap-6 relative overflow-hidden group border-l-8 border-l-orange-500">
          <div className="p-4 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-orange-600 tracking-widest">Pendente</p>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(summary.total_pending)}</h4>
          </div>
        </Card>

        <Card className="p-6 rounded-[2rem] border-zinc-100 dark:border-zinc-800 bg-red-500/5 dark:bg-red-500/10 flex items-center gap-6 relative overflow-hidden group border-l-8 border-l-red-500">
          <div className="p-4 bg-red-500 rounded-2xl text-white shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-red-600 tracking-widest">Vencido</p>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatCurrency(summary.total_overdue)}</h4>
          </div>
        </Card>
      </div>
    </div>
  );
}
