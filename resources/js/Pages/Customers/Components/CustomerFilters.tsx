import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { route } from '@/lib/route';

interface Props {
  filters: {
    search?: string;
    status?: string;
    pending_finance?: string;
  };
}

export default function CustomerFilters({ filters }: Props) {
  const { data, setData, get, reset } = useForm({
    search: filters.search || '',
    status: filters.status || 'all',
    pending_finance: filters.pending_finance || 'all',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    get(route('customers.index'), {
      preserveState: true,
      replace: true,
    });
  };

  const clearFilters = () => {
    reset();
    router.get(route('customers.index'));
  };

  return (
    <form onSubmit={handleSearch} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 mb-6 flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[240px] space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Busca</label>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Nome, telefone ou email..." 
            className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 transition-all focus:ring-2 focus:ring-primary/20"
            value={data.search}
            onChange={e => setData('search', e.target.value)}
          />
        </div>
      </div>

      <div className="w-[200px] space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
        <Select 
          value={data.status} 
          onChange={(e: any) => setData('status', e.target.value)}
          className="h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
        >
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="inactive">Inativos</SelectItem>
        </Select>
      </div>

      <div className="w-[220px] space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Pendência Financeira</label>
        <Select 
          value={data.pending_finance} 
          onChange={(e: any) => setData('pending_finance', e.target.value)}
          className="h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
        >
          <SelectItem value="all">Todas as Situações</SelectItem>
          <SelectItem value="yes">Com Pendência</SelectItem>
          <SelectItem value="no">Sem Pendência</SelectItem>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="h-11 px-6 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Filter className="w-4 h-4 mr-2" />
          Filtrar
        </Button>
        {(data.search || data.status !== 'all' || data.pending_finance !== 'all') && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={clearFilters}
            className="h-11 px-4 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>
    </form>
  );
}
