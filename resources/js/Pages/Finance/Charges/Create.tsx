import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import ChargeForm from '../Components/ChargeForm';
import { route } from '@/utils/route';
import { Customer } from '@/types';

export default function ChargeCreate() {
    return (
        <AppLayout>
            <Head title="Nova Cobrança" />

            <div className="max-w-3xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href={route('finance.charges.index')} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Cobranças
                    </Link>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <PlusCircle className="h-6 w-6 text-gray-400" />
                        Gerar Nova Cobrança
                    </h1>
                </div>

                <ChargeForm />
            </div>
        </AppLayout>
    );
}
