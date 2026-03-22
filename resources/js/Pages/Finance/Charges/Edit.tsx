import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import ChargeForm from '../Components/ChargeForm';
import { Charge } from '@/types';

interface Props {
    charge: Charge;
}

export default function ChargeEdit({ charge }: Props) {
    const handleCancel = () => {
        if (confirm('Tem certeza que deseja cancelar esta cobrança? Esta ação não pode ser desfeita.')) {
            router.delete(route('finance.charges.destroy', charge.id));
        }
    };

    return (
        <AppLayout>
            <Head title={`Editar Cobrança #${charge.id}`} />

            <div className="max-w-3xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex justify-between items-center">
                    <Link href={route('finance.charges.index')} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Cobranças
                    </Link>

                    {charge.status !== 'cancelled' && charge.status !== 'paid' && (
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Cancelar Cobrança
                        </button>
                    )}
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Edit className="h-6 w-6 text-gray-400" />
                        Editar Cobrança
                    </h1>
                </div>

                {charge.status === 'cancelled' ? (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center mb-6">
                        <h3 className="text-lg font-medium text-red-800">Esta cobrança está cancelada</h3>
                        <p className="mt-1 text-sm text-red-600">Não é possível editar cobranças canceladas.</p>
                    </div>
                ) : charge.status === 'paid' ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center mb-6">
                        <h3 className="text-lg font-medium text-emerald-800">Esta cobrança já foi liquidada</h3>
                        <p className="mt-1 text-sm text-emerald-600">Cobranças totalmente pagas não podem ter valores alterados.</p>
                    </div>
                ) : (
                    <ChargeForm charge={charge} />
                )}
            </div>
        </AppLayout>
    );
}
