import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, CreditCard, DollarSign, Wallet, QrCode, Banknote, Calendar, User, Clock, CheckCircle2, History } from 'lucide-react';
import { route } from '@/lib/route';

interface Props {
    appointment: any;
    customer: any;
    professional: any;
    service: any;
    charge: any;
    receipts: any[];
    summary: {
        total_amount: number;
        amount_paid: number;
        balance: number;
    };
    wallet_balance: number;
    available_packages: any[];
}

const methodIcons: any = {
    pix: <QrCode className="w-4 h-4" />,
    card: <CreditCard className="w-4 h-4" />,
    cash: <DollarSign className="w-4 h-4" />,
    transfer: <Wallet className="w-4 h-4" />,
    wallet: <Wallet className="w-4 h-4 text-primary" />,
    package: <History className="w-4 h-4 text-emerald-500" />,
    other: <Banknote className="w-4 h-4" />,
};

const methodLabels: any = {
    pix: 'PIX',
    card: 'Cartão',
    cash: 'Dinheiro',
    transfer: 'Transferência',
    wallet: 'Carteira (Saldo)',
    package: 'Pacote de Sessões',
    other: 'Outro',
};

export default function Checkout({ 
    appointment, customer, professional, service, charge, 
    receipts, summary, wallet_balance, available_packages 
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        amount_received: summary.balance,
        received_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        method: 'pix',
        notes: '',
        customer_package_id: '',
        nps_score: null as number | null,
        nps_comment: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('agenda.checkout.store', appointment.id));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <AppLayout>
            <Head title={`Checkout - ${customer.name}`} />

            <div className="max-w-5xl mx-auto py-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Checkout do Atendimento</h1>
                        <p className="text-muted-foreground text-sm">Registre o pagamento e finalize o fluxo financeiro.</p>
                    </div>
                    {charge?.status === 'paid' && (
                        <Badge className="ml-auto bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Resumo do Atendimento */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" /> Detalhes do Agendamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cliente</Label>
                                    <p className="font-medium flex items-center gap-2">
                                        <User className="w-3 h-3 text-zinc-400" /> {customer.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Serviço</Label>
                                    <p className="font-medium">{service.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Profissional</Label>
                                    <p className="font-medium">{professional.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Horário</Label>
                                    <p className="font-medium flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-zinc-400" /> 
                                        {format(parseISO(appointment.starts_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary" /> Histórico de Recebimentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {receipts.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground italic text-sm">
                                        Nenhum pagamento registrado ainda.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {receipts.map((r) => (
                                            <div key={r.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border shadow-sm">
                                                        {methodIcons[r.method] || <DollarSign className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">{formatCurrency(r.amount_received)}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{methodLabels[r.method]} • {format(parseISO(r.received_at), "dd/MM HH:mm")}</p>
                                                    </div>
                                                </div>
                                                {r.notes && <p className="text-[10px] text-muted-foreground italic max-w-[150px] truncate">{r.notes}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lado Financeiro / Form */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-lg bg-primary/5 dark:bg-primary/10 border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Valor do Atendimento</span>
                                    <span className="font-medium">{formatCurrency(summary.total_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Já Recebido</span>
                                    <span className="font-medium text-emerald-600">{formatCurrency(summary.amount_paid)}</span>
                                </div>
                                <div className="pt-4 border-t flex justify-between items-end">
                                    <span className="font-bold">Saldo Devedor</span>
                                    <span className="text-2xl font-black text-primary">{formatCurrency(summary.balance)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {summary.balance > 0 ? (
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Registrar Recebimento</CardTitle>
                                    <CardDescription>Informe os dados do pagamento atual.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Valor Recebido</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                                <Input 
                                                    id="amount"
                                                    type="number"
                                                    step="0.01"
                                                    className="pl-9 font-bold text-lg"
                                                    value={data.amount_received}
                                                    onChange={e => setData('amount_received', Number(e.target.value))}
                                                />
                                            </div>
                                            {errors.amount_received && <p className="text-xs text-red-500">{errors.amount_received}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="method">Forma de Pagamento</Label>
                                            <Select 
                                                value={data.method} 
                                                onChange={(e: any) => setData('method', e.target.value)}
                                                className="w-full h-10 rounded-md border"
                                            >
                                                <option value="pix">PIX</option>
                                                <option value="card">Cartão</option>
                                                <option value="cash">Dinheiro</option>
                                                <option value="wallet">Carteira (Saldo: {formatCurrency(wallet_balance)})</option>
                                                {available_packages.length > 0 && <option value="package">Pacote de Sessões</option>}
                                                <option value="transfer">Transferência</option>
                                                <option value="other">Outro</option>
                                            </Select>
                                            {errors.method && <p className="text-xs text-red-500">{errors.method}</p>}
                                        </div>

                                        {data.method === 'wallet' && (
                                            <div className={`p-3 rounded-lg border text-sm ${wallet_balance < summary.balance ? 'bg-red-50 border-red-200 text-red-700' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <Wallet className="w-4 h-4" /> Uso de Saldo Interno
                                                </div>
                                                <p>Saldo disponível: {formatCurrency(wallet_balance)}</p>
                                                {wallet_balance < summary.balance && (
                                                    <p className="mt-1 text-xs font-medium">Saldo insuficiente para quitar o total. O débito será realizado e restará um saldo devedor.</p>
                                                )}
                                            </div>
                                        )}

                                        {data.method === 'package' && (
                                            <div className="space-y-2 animate-in fade-in duration-300">
                                                <Label>Selecionar Pacote Disponível</Label>
                                                <Select
                                                    value={data.customer_package_id}
                                                    onChange={(e: any) => setData('customer_package_id', e.target.value)}
                                                    className="w-full h-10 rounded-md border"
                                                >
                                                    <option value="">Selecione o pacote...</option>
                                                    {available_packages.map(cp => (
                                                        <option key={cp.id} value={cp.id}>
                                                            {cp.package.name} ({cp.remaining_sessions} sessões restantes)
                                                        </option>
                                                    ))}
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    O agendamento será quitado usando 1 sessão deste pacote.
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="received_at">Data/Hora Recebimento</Label>
                                            <Input 
                                                id="received_at"
                                                type="datetime-local"
                                                value={data.received_at}
                                                onChange={e => setData('received_at', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Observações</Label>
                                            <Textarea 
                                                id="notes"
                                                placeholder="Ex: Pagamento adiantado, desconto cliente fiel..."
                                                value={data.notes}
                                                onChange={e => setData('notes', e.target.value)}
                                            />
                                        </div>

                                        {/* NPS Section */}
                                        <div className="pt-6 border-t mt-6 space-y-4">
                                            <Label className="text-zinc-900 font-bold block">Como foi a experiência do cliente? (NPS)</Label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[...Array(11).keys()].map(score => (
                                                    <button
                                                        key={score}
                                                        type="button"
                                                        onClick={() => setData('nps_score', score)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border ${
                                                            data.nps_score === score 
                                                                ? 'bg-primary text-white border-primary shadow-md scale-110' 
                                                                : 'bg-white text-zinc-600 border-zinc-200 hover:border-primary/50'
                                                        }`}
                                                    >
                                                        {score}
                                                    </button>
                                                ))}
                                            </div>
                                            <Textarea 
                                                placeholder="Comentário opcional do cliente..."
                                                value={data.nps_comment}
                                                onChange={e => setData('nps_comment', e.target.value)}
                                                className="text-xs min-h-[60px]"
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button 
                                            type="submit" 
                                            className="w-full py-6 text-lg font-bold shadow-lg"
                                            disabled={processing}
                                        >
                                            {data.amount_received >= summary.balance ? 'Receber e Quitar' : 'Registrar Parcial'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        ) : (
                            <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800">
                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-emerald-800 dark:text-emerald-400">Atendimento Quitado</h3>
                                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">Nenhum saldo pendente para este agendamento.</p>
                                <Button variant="outline" className="mt-6 w-full" onClick={() => router.visit(route('agenda'))}>
                                    Voltar para Agenda
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
