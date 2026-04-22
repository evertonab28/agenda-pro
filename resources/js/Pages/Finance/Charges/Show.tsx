import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { FileText, ArrowLeft, Calendar, DollarSign, CheckCircle, CreditCard, Clock, Activity, AlertCircle, ExternalLink, Loader2, Copy } from 'lucide-react';
import axios from 'axios';
import { Charge } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { route } from '@/utils/route';

interface Receipt {
    id: number;
    amount_received: number;
    fee_amount?: number;
    net_amount?: number;
    method: string;
    received_at: string;
    notes: string | null;
}

interface Props {
    charge: Charge & { 
        customer?: { name: string, phone: string, email: string };
        receipts: Receipt[];
        receipts_sum_amount_received: number;
        created_at?: string;
    };
}

export default function ChargeShow({ charge }: Props) {
    const [generatingLink, setGeneratingLink] = useState(false);
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateLink = async () => {
        setGeneratingLink(true);
        setLinkError(null);
        try {
            const response = await axios.post(`/api/charges/${charge.id}/generate-link`);
            setPaymentLink(response.data.url);
        } catch (error: any) {
            setLinkError(error.response?.data?.message || 'Erro ao gerar link de pagamento.');
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleCopy = () => {
        if (!paymentLink) return;
        navigator.clipboard.writeText(paymentLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
            case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Pago';
            case 'partial': return 'Parcial';
            case 'overdue': return 'Vencido';
            case 'canceled': return 'Cancelado';
            default: return 'Pendente';
        }
    };

    const received = charge.receipts_sum_amount_received || 0;
    const openBalance = Math.max(0, charge.amount - received);
    const progress = Math.min(100, Math.round((received / charge.amount) * 100));

    return (
        <AppLayout>
            <Head title={`Detalhes da Cobrança #${charge.id}`} />

            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {/* Back Navigation */}
                <div className="mb-6">
                    <Link href={route('finance.charges.index')} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Cobranças
                    </Link>
                </div>

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-6 sm:p-8">
                        <div className="sm:flex sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <FileText className="h-7 w-7 text-gray-400" />
                                    {charge.description}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        Vencimento: <span className="font-medium text-gray-900">{format(parseISO(charge.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusTheme(charge.status)}`}>
                                        {getStatusLabel(charge.status)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-4 sm:mt-0 flex flex-col items-end gap-3">
                                <div className="text-left sm:text-right bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Valor Total da Cobrança</p>
                                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(charge.amount)}</p>
                                </div>

                                {charge.status !== 'paid' && charge.status !== 'canceled' && (
                                    <div className="flex flex-col items-end gap-2 w-full">
                                        <button
                                            onClick={handleGenerateLink}
                                            disabled={generatingLink}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
                                        >
                                            {generatingLink ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ExternalLink className="w-4 h-4" />
                                            )}
                                            Gerar Link de Pagamento
                                        </button>

                                        {linkError && (
                                            <div className="text-xs text-red-600 flex flex-col gap-1 max-w-xs">
                                                <p className="flex items-start gap-1">
                                                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {linkError}
                                                </p>
                                                {linkError.includes('CPF/CNPJ') && charge.customer_id && (
                                                    <Link href={route('customers.edit', charge.customer_id)} className="underline text-red-700 hover:text-red-900 ml-4">
                                                        Editar cliente →
                                                    </Link>
                                                )}
                                            </div>
                                        )}

                                        {paymentLink && (
                                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 max-w-xs w-full">
                                                <a href={paymentLink} target="_blank" className="text-xs text-emerald-700 truncate flex-1 hover:underline">
                                                    {paymentLink}
                                                </a>
                                                <button onClick={handleCopy} className="text-emerald-600 hover:text-emerald-800 shrink-0" title="Copiar link">
                                                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-8">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-sm font-medium text-emerald-600">Recebido: {formatCurrency(received)}</p>
                                    {openBalance > 0 && <p className="text-sm text-gray-500 mt-1">Falta: <span className="font-medium text-red-600">{formatCurrency(openBalance)}</span></p>}
                                </div>
                                <span className="text-sm font-bold text-gray-900">{progress}% Pago</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details & Customer */}
                    <div className="space-y-8">
                        {/* Customer Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-medium text-gray-900">Detalhes do Cliente</h3>
                            </div>
                            <div className="p-6">
                                {charge.customer ? (
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-1">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Nome</dt>
                                            <dd className="mt-1 text-sm text-gray-900 font-medium"><Link href={route('customers.show', charge.customer_id)} className="text-primary hover:underline">{charge.customer.name}</Link></dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{charge.customer.phone}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{charge.customer.email || '-'}</dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-gray-500 italic">Cobrança Avulsa (sem cliente vinculado)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {charge.notes && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-lg font-medium text-gray-900">Observações</h3>
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{charge.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Timeline / Receipts */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-gray-400" />
                                    Histórico de Recebimentos
                                </h3>
                            </div>
                            
                            <div className="p-6">
                                {charge.receipts && charge.receipts.length > 0 ? (
                                    <div className="flow-root">
                                        <ul role="list" className="-mb-8">
                                            {charge.receipts.map((receipt, receiptIdx) => (
                                                <li key={receipt.id}>
                                                    <div className="relative pb-8">
                                                        {receiptIdx !== charge.receipts.length - 1 ? (
                                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                        ) : null}
                                                        <div className="relative flex space-x-3">
                                                            <div>
                                                                <span className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center ring-8 ring-white">
                                                                    <DollarSign className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                                                                </span>
                                                            </div>
                                                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5 border border-gray-100 rounded-lg p-3 bg-gray-50 mb-2">
                                                                <div>
                                                                    <p className="text-sm text-gray-800">
                                                                        Pagamento recebido via <span className="font-medium capitalize">{receipt.method}</span>
                                                                    </p>
                                                                    {receipt.notes && (
                                                                        <p className="mt-1 text-xs text-gray-500 bg-white p-2 rounded border border-gray-100 mt-2">
                                                                            {receipt.notes}
                                                                        </p>
                                                                    )}
                                                                    {(receipt.fee_amount ?? 0) > 0 && (
                                                                        <div className="mt-2 text-xs flex items-center gap-2">
                                                                            <span className="text-gray-500">Líquido: {formatCurrency(receipt.net_amount ?? 0)}</span>
                                                                            <span className="text-red-400 bg-red-50 px-1 rounded">- Taxa: {formatCurrency(receipt.fee_amount ?? 0)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-right whitespace-nowrap">
                                                                    <div className="text-sm font-bold text-emerald-600">
                                                                        +{formatCurrency(receipt.amount_received)}
                                                                    </div>
                                                                    <time dateTime={receipt.received_at} className="text-xs text-gray-500 block mt-1">
                                                                        {format(parseISO(receipt.received_at), "dd MMM, HH:mm", { locale: ptBR })}
                                                                    </time>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                            
                                            {/* Creation event */}
                                            <li>
                                                <div className="relative pb-8">
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                                                                <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                                            </span>
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5 p-3">
                                                            <div>
                                                                <p className="text-sm text-gray-500">Cobrança gerada no sistema</p>
                                                            </div>
                                                            <div className="text-right whitespace-nowrap text-sm text-gray-500">
                                                                <time dateTime={charge.created_at}>
                                                                    {format(parseISO(charge.created_at || new Date().toISOString()), "dd MMM, yyyy", { locale: ptBR })}
                                                                </time>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 flex flex-col items-center justify-center">
                                        <div className="bg-gray-50 rounded-full p-4 mb-4">
                                            <AlertCircle className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-1">Sem histórico de pagamentos</h3>
                                        <p className="text-sm text-gray-500">Nenhum recebimento foi registrado para esta cobrança ainda.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
