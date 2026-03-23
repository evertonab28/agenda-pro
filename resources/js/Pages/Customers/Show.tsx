import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, Edit2, Share2, MoreVertical, Calendar, DollarSign, History, Wallet, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { route } from '@/utils/route';
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
  wallet_transactions: any[];
  packages: any[];
}

export default function Show({ 
  customer, summary, appointments, financial_history, wallet_transactions, packages 
}: Props) {
  const [showCreditModal, setShowCreditModal] = useState(false);
  
  const creditForm = useForm({
    amount: 0,
    description: 'Depósito manual',
  });

  const handleAddCredit = (e: React.FormEvent) => {
    e.preventDefault();
    creditForm.post(route('customers.add-credit', customer.id), {
        onSuccess: () => {
            setShowCreditModal(false);
            creditForm.reset();
        }
    });
  };

  if (!customer) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto p-12 text-center text-muted-foreground">
          Cliente não encontrado ou dados incompletos.
        </div>
      </AppLayout>
    );
  }

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
                  value="wallet" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 font-bold text-sm text-muted-foreground transition-all"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Carteira & Pacotes
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

              <TabsContent value="wallet" className="mt-0 focus-visible:outline-none space-y-6">
                 {/* Wallet Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm bg-primary/5 border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary/60">Saldo em Carteira</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.wallet?.balance || 0)}
                            </p>
                            <Button 
                                size="sm" 
                                className="mt-4 gap-2" 
                                onClick={() => setShowCreditModal(true)}
                            >
                                <Plus className="w-4 h-4" /> Adicionar Crédito
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                           <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-600/60">Pacotes Ativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black text-emerald-600">
                                {packages.filter((p: any) => p.remaining_sessions > 0).length} <span className="text-sm font-normal text-muted-foreground">pacote(s)</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 italic">Sessões pré-pagas disponíveis para uso imediato.</p>
                        </CardContent>
                    </Card>
                 </div>

                 {/* Packages List */}
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-zinc-400" /> Detalhes dos Pacotes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {packages.map((pkg: any) => (
                            <div key={pkg.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold">{pkg.package.name}</p>
                                    <p className="text-xs text-muted-foreground uppercase">{pkg.remaining_sessions} sessões restantes</p>
                                </div>
                                <Badge className={pkg.remaining_sessions > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                    {pkg.remaining_sessions > 0 ? 'Disponível' : 'Esgotado'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Wallet Transactions */}
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-zinc-400" /> Últimas Movimentações
                    </h3>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-muted-foreground text-[10px] uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold">Data</th>
                                    <th className="px-4 py-3 text-left font-bold">Descrição</th>
                                    <th className="px-4 py-3 text-right font-bold">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {wallet_transactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                                        <td className="px-4 py-3 text-zinc-500">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-3 font-medium">{t.description}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {t.type === 'credit' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {wallet_transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground italic">
                                            Nenhuma movimentação registrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
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

      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Crédito à Carteira</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCredit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credit_amount">Valor do Crédito (R$)</Label>
              <Input 
                id="credit_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={creditForm.data.amount}
                onChange={e => creditForm.setData('amount', parseFloat(e.target.value))}
                required
              />
              {creditForm.errors.amount && <p className="text-xs text-red-500">{creditForm.errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_description">Descrição / Motivo</Label>
              <Input 
                id="credit_description"
                placeholder="Ex: Sinal para agendamento, Depósito antecipado..."
                value={creditForm.data.description}
                onChange={e => creditForm.setData('description', e.target.value)}
                required
              />
              {creditForm.errors.description && <p className="text-xs text-red-500">{creditForm.errors.description}</p>}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreditModal(false)}>Cancelar</Button>
              <Button type="submit" disabled={creditForm.processing}>Confirmar Crédito</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
