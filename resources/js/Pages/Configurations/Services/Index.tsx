import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ConfigLayout from '../Layout';
import { Plus, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServicesTable from './Components/ServicesTable';
import Pagination from '@/components/Pagination';
import { route } from '@/utils/route';
import AppLayout from '@/Layouts/AppLayout';
import { SectionCard } from '@/components/Shared/SectionCard';

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
        <>
            <Head title="Serviços - Configurações" />
            
            <SectionCard 
                title="Gestão de Serviços"
                subtitle="Cadastre e gerencie os serviços oferecidos pelo seu estabelecimento."
                headerAction={
                    <Link href={route('configuracoes.services.create')}>
                        <Button className="bg-primary hover:bg-primary/90 text-white h-9 px-4 text-xs font-bold uppercase tracking-wider">
                            <Plus className="w-4 h-4 mr-1.5" />
                            Novo Serviço
                        </Button>
                    </Link>
                }
                noPadding
                footer={
                    <div className="flex justify-center">
                        <Pagination links={services.links} />
                    </div>
                }
            >
                <ServicesTable services={services.data} />
            </SectionCard>
        </>
    );
}

Index.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Serviços">{page}</ConfigLayout>
    </AppLayout>
);
