import React from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, HelpCircle } from 'lucide-react';

interface Props {
    charge: any;
}

export default function Expired({ charge }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <Head title="Link Expirado" />
            
            <div className="w-full max-w-md text-center">
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6 opacity-80" />
                
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Este link expirou.</h1>
                <p className="text-slate-500 font-medium mb-8">
                    Por razões de segurança, os links de pagamento do AgendaNexo possuem validade limitada.
                </p>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 p-6 mb-8">
                    <CardContent className="pt-4 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <HelpCircle className="w-6 h-6 text-slate-400" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Como resolver?</h4>
                        <p className="text-sm text-slate-500">
                            Entre em contato com <strong>AgendaNexo</strong> ou o profissional responsável para solicitar um novo link.
                        </p>
                    </CardContent>
                </Card>

                <Button 
                    variant="link" 
                    className="text-indigo-600 dark:text-indigo-400 font-black italic"
                    onClick={() => window.location.href = '/'}
                >
                    Voltar para o Início
                </Button>
            </div>
        </div>
    );
}
