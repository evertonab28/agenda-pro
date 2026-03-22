import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Plus, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfessionalsTable from './Components/ProfessionalsTable';
import Pagination from '@/components/Pagination';
import { route } from '@/utils/route';

interface Professional {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    is_active: boolean;
    services: { id: number; name: string }[];
}

interface Props {
    professionals: {
        data: Professional[];
        links: any[];
    };
}

export default function Index({ professionals }: Props) {
    return (
        <ConfigLayout title="Profissionais">
            <Head title="Profissionais - Configurações" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lista de Profissionais</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {professionals.data.length} profissionais cadastrados
                            </p>
                        </div>
                    </div>
                    
                    <Link href={route('configuracoes.professionals.create')}>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Profissional
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    <ProfessionalsTable professionals={professionals.data} />
                    
                    <div className="flex justify-center mt-6">
                        <Pagination links={professionals.links} />
                    </div>
                </div>
            </div>
        </ConfigLayout>
    );
}
