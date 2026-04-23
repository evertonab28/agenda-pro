import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';

interface Props {
    charge: any;
    amount_formatted: string;
}

export default function DirectCheckout({ charge, amount_formatted }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <Head title={`Pagamento - ${charge?.customer?.name ?? 'Cliente'}`} />
            
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 italic">Agenda Pro</h1>
                    <p className="text-slate-500 text-sm font-medium">Checkout Seguro</p>
                </div>

                <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-indigo-500 to-purple-500" />
                    <CardHeader className="text-center pt-8">
                        <Badge variant="outline" className="w-fit mx-auto mb-4 bg-indigo-50 text-indigo-700 border-indigo-100">
                            PAGAMENTO PENDENTE
                        </Badge>
                        <CardTitle className="text-3xl font-black">R$ {amount_formatted}</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            Fatura para {charge?.customer?.name ?? 'Cliente'}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 pb-8 px-8">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Serviço/Referência</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                                    {charge.reference_month}/{charge.reference_year}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vencimento</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                                    {new Date(charge.due_date).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-1">
                                <CreditCard className="w-5 h-5" />
                                Pagar com Cartão
                            </Button>
                            
                            <Button variant="outline" className="w-full h-12 border-slate-200 dark:border-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                                    <span className="text-[10px] text-white font-black italic">pix</span>
                                </div>
                                Pagar com PIX
                            </Button>
                        </div>

                        <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                            Ao prosseguir, você concorda com nossos Termos de Uso. Seus dados estão protegidos por criptografia de ponta a ponta.
                        </p>
                    </CardContent>
                </Card>
                
                <p className="mt-8 text-center text-slate-400 text-xs flex items-center justify-center gap-1 font-bold italic">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Powered by Agenda Pro Finance
                </p>
            </div>
        </div>
    );
}
