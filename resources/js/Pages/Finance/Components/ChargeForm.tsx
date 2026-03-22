import React from 'react';
import { useForm } from '@inertiajs/react';
import { Charge } from '@/types';
import { Save, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
    charge?: Charge;
}

export default function ChargeForm({ charge }: Props) {
    const isEditing = !!charge;

    const { data, setData, post, put, processing, errors } = useForm({
        description: charge?.description || '',
        customer_id: charge?.customer_id || '',
        amount: charge?.amount || '',
        due_date: charge?.due_date ? format(parseISO(charge.due_date), 'yyyy-MM-dd') : '',
        payment_method: charge?.payment_method || '',
        notes: charge?.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            put(route('finance.charges.update', charge.id));
        } else {
            post(route('finance.charges.store'));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            {isEditing ? 'Informações da Cobrança' : 'Nova Cobrança'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Preencha os detalhes para registrar uma cobrança manual no sistema.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição *</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="description"
                                    id="description"
                                    className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${errors.description ? 'border-red-300 text-red-900' : ''}`}
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    required
                                    placeholder="Ex: Consultoria Mensal"
                                />
                            </div>
                            {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor Total (R$) *</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">R$</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    name="amount"
                                    id="amount"
                                    className={`focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md ${errors.amount ? 'border-red-300 text-red-900' : ''}`}
                                    value={data.amount}
                                    onChange={e => setData('amount', e.target.value)}
                                    required
                                />
                            </div>
                            {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount}</p>}
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Data de Vencimento *</label>
                            <div className="mt-1">
                                <input
                                    type="date"
                                    name="due_date"
                                    id="due_date"
                                    className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${errors.due_date ? 'border-red-300 text-red-900' : ''}`}
                                    value={data.due_date}
                                    onChange={e => setData('due_date', e.target.value)}
                                    required
                                />
                            </div>
                            {errors.due_date && <p className="mt-2 text-sm text-red-600">{errors.due_date}</p>}
                        </div>

                        {/* Customer_id field omitted for simplicity. In a real scenario we'd use an async select component like react-select */}

                        <div className="sm:col-span-3">
                            <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">Método Esperado</label>
                            <div className="mt-1">
                                <select
                                    id="payment_method"
                                    name="payment_method"
                                    className={`shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md ${errors.payment_method ? 'border-red-300 text-red-900' : ''}`}
                                    value={data.payment_method}
                                    onChange={e => setData('payment_method', e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="pix">PIX</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="cartao">Cartão</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="transferencia">Transferência</option>
                                </select>
                            </div>
                            {errors.payment_method && <p className="mt-2 text-sm text-red-600">{errors.payment_method}</p>}
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Observações Internas</label>
                            <div className="mt-1">
                                <textarea
                                    id="notes"
                                    name="notes"
                                    rows={3}
                                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 rounded-md"
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                />
                            </div>
                            {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes}</p>}
                        </div>
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {processing ? 'Salvando...' : 'Salvar Cobrança'}
                    </button>
                </div>
            </div>
        </form>
    );
}
