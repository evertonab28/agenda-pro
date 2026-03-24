import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, ArrowLeft } from 'lucide-react';

interface Props {
    charge: any;
}

export default function Paid({ charge }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <Head title="Cobrança Quitada" />
            
            <div className="w-full max-w-md">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-50 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Obrigado!</h1>
                <p className="text-slate-500 font-medium mb-8">
                    Esta cobrança já foi devidamente quitada e processada pelo nosso sistema.
                </p>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden mb-8">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 pb-4 border-b">
                        <CardTitle className="text-lg font-bold">Resumo do Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between">
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Valor Pago</span>
                            <span className="text-slate-900 dark:text-slate-100 font-black">R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Referência</span>
                            <span className="text-slate-900 dark:text-slate-100 font-bold">{charge.reference_month}/{charge.reference_year}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" />
                        Baixar Comprovante
                    </Button>
                    
                    <Button 
                        variant="link" 
                        className="text-slate-400 font-bold text-xs flex items-center justify-center gap-1"
                        onClick={() => window.location.href = '/'}
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Sair do Checkout
                    </Button>
                </div>
            </div>
        </div>
    );
}
