import React from "react";
import { Head, Link } from "@inertiajs/react";
import ConfigLayout from "../Layout";
import { Scissors, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceForm from "./Components/ServiceForm";
import { route } from "@/utils/route";

interface Service {
    id: number;
    name: string;
    duration_minutes: number;
    price: string | number;
    color: string | null;
    is_active: boolean;
    description: string | null;
    buffer_minutes: number;
}

interface Props {
    service: Service;
}

import AppLayout from '@/Layouts/AppLayout';

export default function Edit({ service }: Props) {
    return (
        <>
            <Head title={`Editar ${service.name} - Configurações`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route("configuracoes.services.index")}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Scissors className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Editar Serviço
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Atualizando:{" "}
                                <span className="font-bold text-primary">
                                    {service.name}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl border rounded-xl p-6 bg-gray-50/30 dark:bg-zinc-800/20">
                    <ServiceForm service={service} />
                </div>
            </div>
        </>
    );
}

Edit.layout = (page: any) => (
    <AppLayout>
        <ConfigLayout title="Editar Serviço">{page}</ConfigLayout>
    </AppLayout>
);
