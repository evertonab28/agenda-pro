import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Plus, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfessionalsTable from './Components/ProfessionalsTable';
import Pagination from '@/components/Pagination';
import { route } from '@/utils/route';
import AppLayout from '@/Layouts/AppLayout';
import { SectionCard } from '@/components/Shared/SectionCard';

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
        <>
            <Head title="Profissionais - Configurações" />
            
            <SectionCard 
                title="Gestão de Profissionais"
                subtitle="Visualize e gerencie a equipe de atendimento do seu estabelecimento."
                headerAction={
                    <Link href={route('configuracoes.professionals.create')}>
                        <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 text-xs font-bold uppercase tracking-wider">
                            <Plus className="w-4 h-4 mr-1.5" />
                            Novo Profissional
                        </Button>
                    </Link>
                }
                noPadding
                footer={
                    <div className="flex justify-center">
                        <Pagination links={professionals.links} />
                    </div>
                }
            >
                <ProfessionalsTable professionals={professionals.data} />
            </SectionCard>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Profissionais">{page}</ConfigLayout>
    </AppLayout>
);
