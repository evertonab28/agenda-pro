import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, ArrowLeft, ExternalLink, Calendar, Receipt, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Charges({ clinic }) {
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (window as any).axios.get(`/p/${clinic.slug}/charges`)
            .then(res => {
                setCharges(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro ao carregar faturas');
                setLoading(false);
            });
    }, [clinic.slug]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Head title={`Minhas Faturas - ${clinic.name}`} />

            <header className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center space-x-4">
                    <Link href={route('portal.dashboard', clinic.slug)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-lg font-bold text-indigo-900">Minhas Faturas</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 py-8">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : charges.length > 0 ? (
                    <div className="space-y-4">
                        {charges.map(charge => (
                            <Card key={charge.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row">
                                    <div className="flex-1 p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium text-slate-500 uppercase flex items-center">
                                                    <Receipt size={14} className="mr-1" />
                                                    Fatura #{charge.id}
                                                </div>
                                                <div className="text-2xl font-bold text-slate-900">
                                                    R$ {parseFloat(charge.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                            <div className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                                                Pendente
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                                            <div className="flex items-center">
                                                <Calendar size={16} className="mr-2 text-slate-400" />
                                                Vencimento: {format(new Date(charge.due_date), "dd 'de' MMMM", { locale: ptBR })}
                                            </div>
                                            {charge.appointment && (
                                                <div className="flex items-center">
                                                    <CreditCard size={16} className="mr-2 text-slate-400" />
                                                    Ref: Agendamento {format(new Date(charge.appointment.starts_at), "dd/MM")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border-t md:border-t-0 md:border-l p-6 flex items-center justify-center md:w-56">
                                        <Button 
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12"
                                            onClick={() => window.open(`/pay/${charge.payment_link_hash}`, '_blank')}
                                        >
                                            Pagar Agora
                                            <ExternalLink size={16} className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 space-y-4 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="flex justify-center">
                            <div className="bg-slate-100 p-4 rounded-full text-slate-400">
                                <CreditCard size={48} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">Nenhuma fatura pendente</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">Você está em dia com seus pagamentos! Continue assim.</p>
                        </div>
                        <Button variant="outline" onClick={() => window.location.href = route('portal.dashboard', clinic.slug)}>
                            Voltar ao Início
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
