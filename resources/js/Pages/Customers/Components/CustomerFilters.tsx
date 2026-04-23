import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { route } from '@/lib/route';
import { SectionCard } from '@/components/Shared/SectionCard';

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
    <SectionCard className="mb-6" contentClassName="p-4">
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px] space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Busca</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Nome, telefone ou email..." 
              className="pl-9 h-10 bg-muted/30 border-border/60 transition-all focus:ring-2 focus:ring-primary/20"
              value={data.search}
              onChange={e => setData('search', e.target.value)}
            />
          </div>
        </div>

        <div className="w-[180px] space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
          <Select 
            value={data.status} 
            onChange={(e: any) => setData('status', e.target.value)}
            className="h-10 bg-muted/30 border-border/60"
          >
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </Select>
        </div>

        <div className="w-[200px] space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Financeiro</label>
          <Select 
            value={data.pending_finance} 
            onChange={(e: any) => setData('pending_finance', e.target.value)}
            className="h-10 bg-muted/30 border-border/60"
          >
            <SelectItem value="all">Todas as Situações</SelectItem>
            <SelectItem value="yes">Com Pendência</SelectItem>
            <SelectItem value="no">Sem Pendência</SelectItem>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="h-10 px-6 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10">
            <Filter className="w-3.5 h-3.5 mr-2" />
            Filtrar
          </Button>
          {(data.search || data.status !== 'all' || data.pending_finance !== 'all') && (
            <Button 
              type="button" 
              variant="ghost" 
              onClick={clearFilters}
              className="h-10 px-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </form>
    </SectionCard>
  );
}
