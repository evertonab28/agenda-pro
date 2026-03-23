import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, MessageSquare, Copy, Phone } from 'lucide-react';
import { route } from '@/utils/route';

interface Props {
    segment: string;
    customers: any[];
}

export default function SegmentReport({ segment, customers }: Props) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Número copiado!');
    };

    return (
        <AppLayout>
            <Head title={`Segmento: ${segment}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('crm.index')}>
                        <Button variant="outline" size="icon" className="rounded-full">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Clientes: {segment}</h1>
                        <p className="text-muted-foreground">{customers.length} cliente(s) identificado(s) neste perfil.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {customers.map(customer => (
                        <Card key={customer.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
                            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                        {customer.name.substring(0, 1)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{customer.name}</p>
                                        <p className="text-sm text-muted-foreground">{customer.email || 'Sem e-mail'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right mr-4 hidden md:block">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">WhatsApp</p>
                                        <p className="font-mono font-medium">{customer.phone}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(customer.phone)}>
                                        <Copy className="w-3.5 h-3.5 mr-2" /> Copiar
                                    </Button>
                                    <Link href={route('customers.show', customer.id)}>
                                        <Button variant="secondary" size="sm">Ver Perfil</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {customers.length === 0 && (
                        <div className="py-20 text-center space-y-4 bg-zinc-50 border-2 border-dashed rounded-[2rem]">
                            <p className="text-muted-foreground">Nenhum cliente encontrado para este segmento no momento.</p>
                            <Link href={route('crm.index')}>
                                <Button variant="link">Voltar ao CRM</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
