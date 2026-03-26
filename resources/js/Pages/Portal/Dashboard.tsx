import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, User, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard({ clinic, customer }: { clinic: any, customer: any }) {
    const [chargesCount, setChargesCount] = useState(0);

    useEffect(() => {
        (window as any).axios.get(`/p/${clinic.slug}/charges`)
            .then((res: any) => setChargesCount(res.data.length))
            .catch((err: any) => console.error('Erro ao carregar faturas'));
    }, [clinic.slug]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Head title={`Dashboard - ${clinic.name}`} />
            
            <header className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-indigo-900">{clinic.name}</h1>
                    <div className="flex items-center space-x-4">
                        <Link href={route('portal.profile', clinic.slug)} className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span className="hidden sm:inline">Meu Perfil</span>
                        </Link>
                        <Link href={route('portal.logout', clinic.slug)} method="post" as="button" className="text-sm font-medium text-slate-500 hover:text-red-600">
                            Sair
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 py-8 space-y-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold text-slate-900">Olá, {customer.name}!</h2>
                    <p className="text-slate-500">O que você deseja fazer hoje?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-indigo-100 group" onClick={() => window.location.href = route('portal.appointments', clinic.slug)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <ArrowRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <CardTitle className="text-xl mb-1">Meus Agendamentos</CardTitle>
                            <p className="text-sm text-slate-500">Veja seus horários confirmados e histórico detalhado.</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className={`hover:shadow-lg transition-all cursor-pointer border-emerald-100 group ${chargesCount > 0 ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                        onClick={() => window.location.href = route('portal.charges', clinic.slug)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors relative">
                                <CreditCard className="w-8 h-8" />
                                {chargesCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                        {chargesCount}
                                    </span>
                                )}
                            </div>
                            <ArrowRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <CardTitle className="text-xl mb-1">Pagar Faturas</CardTitle>
                            <p className="text-sm text-slate-500">
                                {chargesCount > 0 
                                    ? `Você possui ${chargesCount} fatura(s) pendente(s).` 
                                    : 'Nenhuma fatura pendente no momento.'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-all cursor-pointer border-slate-100 group md:col-span-2" onClick={() => window.location.href = route('portal.profile', clinic.slug)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="bg-slate-100 p-3 rounded-xl text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                <User className="w-8 h-8" />
                            </div>
                            <ArrowRight className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <CardTitle className="text-xl mb-1">Minha Conta</CardTitle>
                            <p className="text-sm text-slate-500">Mantenha seus dados de contato e preferências atualizados.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white flex flex-col items-center justify-center space-y-6 shadow-xl shadow-indigo-200">
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">Precisa de um novo horário?</h3>
                        <p className="text-indigo-100 opacity-90 max-w-sm mx-auto">
                            Agende seu próximo atendimento agora mesmo de forma rápida e segura.
                        </p>
                    </div>
                    <Button 
                        onClick={() => window.location.href = route('portal.schedule', clinic.slug)}
                        className="bg-white text-indigo-600 hover:bg-slate-100 font-bold px-10 h-14 text-xl rounded-xl shadow-lg border-0"
                    >
                        Novo Agendamento
                    </Button>
                </div>
            </main>
        </div>
    );
}
