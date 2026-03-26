import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import { Search, User, Loader2, X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
}

interface Props {
    value: string | number;
    onChange: (id: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
}

export default function CustomerAutocomplete({ value, onChange, label, placeholder = "Buscar cliente...", error }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [results, setResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Carregar cliente inicial se houver um ID no 'value' mas não tivermos o objeto selecionado
    useEffect(() => {
        if (value && String(value) !== '0' && (!selectedCustomer || String(selectedCustomer.id) !== String(value))) {
            axios.get(`/customers/search?id=${value}`)
                .then(res => {
                    setSelectedCustomer(res.data);
                    setSearchTerm(res.data.name);
                })
                .catch(() => {
                    // Se falhar (ex: id inválido), limpa
                    clearSelection();
                });
        } else if (!value) {
            setSelectedCustomer(null);
            setSearchTerm('');
        }
    }, [value]);

    useEffect(() => {
        // Não busca se o termo for curto ou se for EXATAMENTE o nome do cara que já selecionamos
        if (debouncedSearch.length < 2) {
            setResults([]);
            return;
        }

        if (selectedCustomer && debouncedSearch === selectedCustomer.name) {
            return;
        }

        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/customers/search?q=${debouncedSearch}`);
                // A API usa paginação (data.data)
                setResults(response.data.data || []);
                setIsOpen(true);
            } catch (err) {
                console.error("Erro ao buscar clientes:", err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [debouncedSearch]);

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setSearchTerm(customer.name);
        onChange(String(customer.id));
        setIsOpen(false);
    };

    const clearSelection = () => {
        setSelectedCustomer(null);
        setSearchTerm('');
        onChange('');
        setResults([]);
    };

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            {label && <Label className="text-sm font-semibold">{label}</Label>}
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="w-4 h-4" />
                </div>
                
                <Input
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!e.target.value) clearSelection();
                    }}
                    onFocus={() => {
                        if (searchTerm.length >= 2) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className={cn(
                        "pl-10 pr-10 h-10 transition-all focus:ring-2 focus:ring-primary/20",
                        error ? "border-red-500 bg-red-50/10" : "bg-white dark:bg-zinc-950"
                    )}
                />
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {loading && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
                    )}
                    
                    {!loading && selectedCustomer && (
                        <button 
                            type="button"
                            onClick={clearSelection}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-red-500 transition-all border border-transparent hover:border-zinc-200"
                            title="Limpar seleção"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {error && <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">{error}</p>}

            {/* Dropdown de Resultados */}
            {isOpen && (results.length > 0 || (searchTerm.length >= 2 && !loading)) && (
                <div className="absolute z-[60] w-full mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-[280px] overflow-auto py-2 animate-in fade-in zoom-in-95 duration-200">
                    {results.length > 0 ? (
                        <div className="px-2 space-y-1">
                            {results.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => handleSelect(c)}
                                    className={cn(
                                        "w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-left",
                                        selectedCustomer?.id === c.id 
                                            ? "bg-primary/10 text-primary border-primary/20 border" 
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                        selectedCustomer?.id === c.id ? "bg-primary text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                    )}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold truncate">{c.name}</span>
                                            {selectedCustomer?.id === c.id && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Selecionado</span>
                                            )}
                                        </div>
                                        {(c.phone || c.email) && (
                                            <span className="text-xs opacity-60 truncate">
                                                {c.phone}{c.phone && c.email ? ' • ' : ''}{c.email}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-4 py-8 text-center">
                            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-5 h-5 text-zinc-300" />
                            </div>
                            <p className="text-sm font-medium text-zinc-500">Nenhum cliente encontrado para "{searchTerm}"</p>
                            <p className="text-xs text-zinc-400 mt-1">Verifique a ortografia ou tente outro termo.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
