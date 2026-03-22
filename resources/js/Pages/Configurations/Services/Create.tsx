import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Scissors, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServiceForm from './Components/ServiceForm';
import { route } from '@/utils/route';

export default function Create() {
    return (
        <ConfigLayout title="Novo Serviço">
            <Head title="Novo Serviço - Configurações" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('configuracoes.services.index')}>
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Scissors className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Criar Novo Serviço</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados abaixo para cadastrar um novo serviço.</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl border rounded-xl p-6 bg-gray-50/30 dark:bg-zinc-800/20">
                    <ServiceForm />
                </div>
            </div>
        </ConfigLayout>
    );
}
