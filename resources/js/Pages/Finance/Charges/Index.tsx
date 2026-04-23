import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, Search, Download, FileText } from 'lucide-react';
import ChargeFilters from '../Components/ChargeFilters';
import ChargesTable from '../Components/ChargesTable';
import Pagination from '@/components/Pagination';
import { route } from '@/utils/route';
import { Charge } from '@/types';

interface Filters {
    search?: string;
    status?: string;
    payment_method?: string;
    due_date_start?: string;
    due_date_end?: string;
}

interface Props {
    charges: {
        data: Charge[];
        links: any[];
        total: number;
    };
    filters: Filters;
}

export default function ChargesIndex({ charges, filters }: Props) {
    return (
        <>
            <Head title="Cobranças" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-gray-700" />
                            Gestão de Cobranças
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Acompanhe e registre recebimentos de todas as cobranças. &bull; <span className="font-medium text-gray-900">{charges.total} encontradas</span>
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex gap-2">
                            <a 
                                href={route('finance.charges.export')} 
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar CSV
                            </a>
                            <Link
                                href={route('finance.charges.create')}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Cobrança
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <ChargeFilters filters={filters} />

                {/* Main Table Area */}
                <div className="flex flex-col">
                    <ChargesTable charges={charges.data} />
                    
                    {/* Pagination */}
                    {charges.links && charges.links.length > 3 && (
                        <div className="mt-6">
                            <Pagination links={charges.links} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

ChargesIndex.layout = (page: any) => <AppLayout children={page} />;
