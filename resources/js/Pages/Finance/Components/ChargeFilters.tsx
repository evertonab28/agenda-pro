import React from 'react';
import { useForm } from '@inertiajs/react';
import { Search, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { route } from '@/utils/route';

interface Filters {
    search?: string;
    status?: string;
    payment_method?: string;
    due_date_start?: string;
    due_date_end?: string;
}

interface Props {
    filters: Filters;
}

export default function ChargeFilters({ filters }: Props) {
    if (!filters) return null;

    const { data, setData, get, processing } = useForm<Filters>({
        search: filters.search || '',
        status: filters.status || 'all',
        payment_method: filters.payment_method || 'all',
        due_date_start: filters.due_date_start || '',
        due_date_end: filters.due_date_end || '',
    });

    const [debouncedSearch] = useDebounce(data.search, 500);

    React.useEffect(() => {
        if (debouncedSearch !== filters.search) {
            applyFilters();
        }
    }, [debouncedSearch]);

    const applyFilters = () => {
        get(route('finance.charges.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSelectChange = (key: keyof Filters, value: string) => {
        setData(key, value);
        setTimeout(() => applyFilters(), 50);
    };

    const clearFilters = () => {
        setData({
            search: '',
            status: 'all',
            payment_method: 'all',
            due_date_start: '',
            due_date_end: '',
        });
        setTimeout(() => get(route('finance.charges.index')), 50);
    };

    const hasActiveFilters = data.search || data.status !== 'all' || data.payment_method !== 'all' || data.due_date_start || data.due_date_end;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={data.search}
                    onChange={(e) => setData('search', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Buscar por cliente ou descrição..."
                />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-4">
                <select
                    value={data.status}
                    onChange={(e) => handleSelectChange('status', e.target.value)}
                    className="block w-full sm:w-auto py-2 pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg"
                >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="partial">Parcial</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Vencido</option>
                    <option value="cancelled">Cancelado</option>
                </select>

                <select
                    value={data.payment_method}
                    onChange={(e) => handleSelectChange('payment_method', e.target.value)}
                    className="block w-full sm:w-auto py-2 pl-3 pr-10 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg"
                >
                    <option value="all">Todos os Métodos</option>
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="transferencia">Transferência</option>
                </select>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={data.due_date_start}
                        onChange={(e) => handleSelectChange('due_date_start', e.target.value)}
                        className="block w-full sm:w-auto py-2 px-3 border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg text-gray-700"
                        title="Vencimento Inicial"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={data.due_date_end}
                        onChange={(e) => handleSelectChange('due_date_end', e.target.value)}
                        className="block w-full sm:w-auto py-2 px-3 border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg text-gray-700"
                        title="Vencimento Final"
                    />
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                    </button>
                )}
            </div>
        </div>
    );
}
