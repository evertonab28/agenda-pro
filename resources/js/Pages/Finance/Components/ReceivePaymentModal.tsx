import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Charge } from '@/types'; // Assumindo tipagem padrão, podemos contornar com any se falhar.
import { format } from 'date-fns';

interface Props {
    charge: any; // Type it properly if possible
    isOpen: boolean;
    onClose: () => void;
}

export default function ReceivePaymentModal({ charge, isOpen, onClose }: Props) {
    const amountReceivedSoFar = charge?.receipts_sum_amount_received || 0;
    const openBalance = Math.max(0, (charge?.amount || 0) - amountReceivedSoFar);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        amount_received: openBalance > 0 ? openBalance : '',
        received_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        method: charge?.payment_method || 'pix',
        fee_amount: 0,
        notes: '',
    });

    useEffect(() => {
        if (isOpen && charge) {
            const currentOpen = Math.max(0, (charge.amount || 0) - (charge.receipts_sum_amount_received || 0));
            setData({
                amount_received: currentOpen,
                received_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                method: charge.payment_method || 'pix',
                fee_amount: 0,
                notes: '',
            });
            clearErrors();
        }
    }, [isOpen, charge]);

    if (!isOpen || !charge) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('finance.charges.receive', charge.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
                
                <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                        <button
                            type="button"
                            className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Fechar</span>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-emerald-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Registrar Recebimento
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Cobrança: <span className="font-semibold">{charge.description}</span>
                                </p>
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg flex justify-between border border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-500">Valor Total</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(charge.amount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Saldo em Aberto</p>
                                        <p className="text-sm font-semibold text-emerald-600">{formatCurrency(openBalance)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="amount_received" className="block text-sm font-medium text-gray-700">
                                Valor Recebido (R$) *
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">R$</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={openBalance}
                                    id="amount_received"
                                    className={`focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md ${errors.amount_received ? 'border-red-300 text-red-900' : ''}`}
                                    value={data.amount_received}
                                    onChange={e => setData('amount_received', parseFloat(e.target.value) || '')}
                                    required
                                />
                            </div>
                            {errors.amount_received && <p className="mt-1 text-xs text-red-600">{errors.amount_received}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="method" className="block text-sm font-medium text-gray-700">Método *</label>
                                <select
                                    id="method"
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    value={data.method}
                                    onChange={e => setData('method', e.target.value)}
                                >
                                    <option value="pix">PIX</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="cartao">Cartão</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="transferencia">Transferência</option>
                                </select>
                                {errors.method && <p className="mt-1 text-xs text-red-600">{errors.method}</p>}
                            </div>
                            <div>
                                <label htmlFor="received_at" className="block text-sm font-medium text-gray-700">Data e Hora *</label>
                                <input
                                    type="datetime-local"
                                    id="received_at"
                                    className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    value={data.received_at}
                                    onChange={e => setData('received_at', e.target.value)}
                                    required
                                />
                                {errors.received_at && <p className="mt-1 text-xs text-red-600">{errors.received_at}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="fee_amount" className="block text-sm font-medium text-gray-700">Taxa do Meio de Pagamento (R$)</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">R$</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    id="fee_amount"
                                    className="focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                    value={data.fee_amount}
                                    onChange={e => setData('fee_amount', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Opcional. Valor descontado (ex: taxa da maquininha).</p>
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Observações</label>
                            <textarea
                                id="notes"
                                rows={2}
                                className="mt-1 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                            />
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse border-t pt-4 border-gray-100">
                            <button
                                type="submit"
                                disabled={processing || openBalance <= 0}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Registrando...' : 'Confirmar Recebimento'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={onClose}
                                disabled={processing}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
