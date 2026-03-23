import React, { useState } from 'react';
import { Charge } from '@/types'; // Or any if not defined
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Edit, Eye, CreditCard, User } from 'lucide-react';
import ReceivePaymentModal from './ReceivePaymentModal';
import { Link } from '@inertiajs/react';
import { route } from '@/utils/route';

interface Props {
    charges: any[]; 
}

export default function ChargesTable({ charges }: Props) {
    const [selectedCharge, setSelectedCharge] = useState<any>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const safeFormat = (dateStr: string, formatStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return format(date, formatStr, { locale: ptBR });
        } catch (e) {
            return 'Error';
        }
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
            default: return 'bg-blue-100 text-blue-800 border-blue-200'; // pending
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

    const handleOpenPayment = (charge: any) => {
        setSelectedCharge(charge);
        setIsPaymentModalOpen(true);
    };

    if (charges.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhuma cobrança encontrada</h3>
                <p className="mt-1 text-gray-500">Tente buscar por um cliente diferente ou alterar os filtros.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição / Cliente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor / Saldo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {charges.map((charge) => {
                            const received = charge.receipts_sum_amount_received || 0;
                            const openBalance = Math.max(0, charge.amount - received);
                            const canReceive = openBalance > 0 && charge.status !== 'canceled';

                            return (
                                <tr key={charge.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{charge.description}</div>
                                        <div className="text-sm text-gray-500 flex items-center mt-1">
                                            <User className="w-3 h-3 mr-1" />
                                            {charge.customer ? charge.customer.name : 'Avulso'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {safeFormat(charge.due_date, "dd 'de' MMM, yyyy")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{formatCurrency(charge.amount)}</div>
                                        {charge.status !== 'paid' && charge.status !== 'canceled' && (
                                            <div className="text-xs text-red-600 font-medium">Falta {formatCurrency(openBalance)}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusTheme(charge.status)}`}>
                                            {getStatusLabel(charge.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route('finance.charges.show', charge.id)} className="text-gray-400 hover:text-primary transition-colors p-1" title="Ver Detalhes">
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            {canReceive && (
                                                <button
                                                    onClick={() => handleOpenPayment(charge)}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
                                                >
                                                    <Check className="w-3.5 h-3.5 mr-1" /> Receber
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ReceivePaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)} 
                charge={selectedCharge} 
            />
        </div>
    );
}
