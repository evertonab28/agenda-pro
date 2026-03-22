import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Plus, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServicesTable from './Components/ServicesTable';
import Pagination from '@/components/Pagination';
import { route } from '@/utils/route';

interface Service {
    id: number;
    name: string;
    duration_minutes: number;
    price: string | number;
    color: string | null;
    is_active: boolean;
    description: string | null;
}

interface Props {
    services: {
        data: Service[];
        links: any[];
    };
}

export default function Index({ services }: Props) {
    return (
        <ConfigLayout title="Serviços">
            <Head title="Serviços - Configurações" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Scissors className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lista de Serviços</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {services.data.length} serviços cadastrados
                            </p>
                        </div>
                    </div>
                    
                    <Link href={route('configuracoes.services.create')}>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Serviço
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    <ServicesTable services={services.data} />
                    
                    <div className="flex justify-center mt-6">
                        <Pagination links={services.links} />
                    </div>
                </div>
            </div>
        </ConfigLayout>
    );
}
