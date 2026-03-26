import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, Toaster } from 'sonner';

interface LoginProps {
    clinic: {
        name: string;
        slug: string;
    };
    initialIdentifier?: string;
}

export default function Login({ clinic, initialIdentifier }: LoginProps) {
    const [step, setStep] = useState(1); // 1: identifier, 2: name (new user), 3: token
    const [identifier, setIdentifier] = useState(initialIdentifier || '');
    const [name, setName] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (initialIdentifier && step === 1) {
            setLoading(true);
            (window as any).axios.post(`/p/${clinic.slug}/auth/send-token`, {
                identifier: initialIdentifier
            }).then((res: any) => {
                if (res.data.requires_name) {
                    setStep(2);
                } else if (res.data.ok) {
                    setStep(3);
                    toast.success('Agendamento confirmado! Enviamos seu código de acesso.');
                }
            }).catch(() => {
                // Ignore or let user try manually if error
            }).finally(() => setLoading(false));
        }
    }, []);

    const handleSendToken = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        (window as any).axios.post(`/p/${clinic.slug}/auth/send-token`, {
            identifier,
            name: step === 2 ? name : undefined
        }).then((res: any) => {
            if (res.data.requires_name) {
                setStep(2);
                toast.info('Novo por aqui? Informe seu nome para continuar.');
            } else if (res.data.ok) {
                setStep(3);
                toast.success('Código de acesso enviado!');
            }
        }).catch((err: any) => {
            toast.error(err.response?.data?.message || 'Erro ao processar solicitação');
        }).finally(() => setLoading(false));
    };

    const handleVerifyToken = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        (window as any).axios.post(`/p/${clinic.slug}/auth/verify-token`, {
            identifier,
            token
        }).then((res: any) => {
            if (res.data.ok) {
                window.location.href = res.data.redirect;
            }
        }).catch((err: any) => {
            toast.error(err.response?.data?.message || 'Código inválido');
        }).finally(() => setLoading(false));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Toaster position="top-center" richColors />
            <Head title={`Login - ${clinic.name}`} />
            
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-indigo-600">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">{clinic.name}</CardTitle>
                    <CardDescription>
                        {step === 2 ? 'Complete seu cadastro' : 'Acesse sua área exclusiva'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <form onSubmit={handleSendToken} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Telefone ou Email</Label>
                                <Input 
                                    id="identifier"
                                    placeholder="(11) 99999-9999 ou seu@email.com"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11" disabled={loading}>
                                Receber Código de Acesso
                            </Button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSendToken} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Como podemos te chamar? (Nome Completo)</Label>
                                <Input 
                                    id="name"
                                    placeholder="Seu nome completo"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11" disabled={loading}>
                                Criar Conta e Enviar Código
                            </Button>
                            <button 
                                type="button" 
                                onClick={() => setStep(1)}
                                className="w-full text-sm text-slate-500 hover:text-indigo-600"
                            >
                                Voltar
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleVerifyToken} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="token">Código de 6 dígitos</Label>
                                <Input 
                                    id="token"
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                                    value={token}
                                    onChange={e => setToken(e.target.value)}
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11" disabled={loading}>
                                Entrar no Portal
                            </Button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setStep(1);
                                    setToken('');
                                }}
                                className="w-full text-sm text-slate-500 hover:text-indigo-600"
                            >
                                Voltar / Alterar contato
                            </button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
