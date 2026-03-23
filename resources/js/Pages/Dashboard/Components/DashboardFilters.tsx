import { Calendar, Download } from 'lucide-react';
import { FiltersState } from './types';
import { router } from '@inertiajs/react';

interface Props {
  filterState: FiltersState;
  setFilterState: (state: FiltersState) => void;
  exportUrl: string;
  canExport?: boolean;
}

export function DashboardFilters({ filterState, setFilterState, exportUrl, canExport = true }: Props) {
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/dashboard', filterState as any, { preserveState: true });
  };

  const handleStatusToggle = (val: string) => {
    setFilterState({
      ...filterState,
      status: filterState.status.includes(val) 
        ? filterState.status.filter(s => s !== val) 
        : [...filterState.status, val]
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        
        <div className="flex gap-2 items-center flex-wrap">
          <form className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border shadow-sm" onSubmit={handleFilter}>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mx-2" />
              <input 
                type="date" 
                className="text-sm bg-transparent border-none focus:ring-0 p-1 text-gray-700 dark:text-gray-300 w-32"
                value={filterState.from || ''}
                onChange={(e) => setFilterState({ ...filterState, from: e.target.value })}
              />
              <span className="text-gray-400 px-1">até</span>
              <input 
                type="date" 
                className="text-sm bg-transparent border-none focus:ring-0 p-1 text-gray-700 dark:text-gray-300 w-32"
                value={filterState.to || ''}
                onChange={(e) => setFilterState({ ...filterState, to: e.target.value })}
              />
            </div>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>
            
            <input 
              type="number" 
              placeholder="ID Prof."
              className="text-sm bg-transparent border border-gray-200 dark:border-zinc-700 rounded p-1 w-20 focus:ring-1 focus:ring-primary"
              value={filterState.professional_id || ''}
              onChange={(e) => setFilterState({ ...filterState, professional_id: e.target.value })}
            />

            <input 
              type="number" 
              placeholder="ID Serv."
              className="text-sm bg-transparent border border-gray-200 dark:border-zinc-700 rounded p-1 w-20 focus:ring-1 focus:ring-primary"
              value={filterState.service_id || ''}
              onChange={(e) => setFilterState({ ...filterState, service_id: e.target.value })}
            />

            <button type="submit" className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors ml-auto sm:ml-2">
              Filtrar
            </button>
          </form>

          {canExport && (
            <a href={exportUrl} target="_blank" className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium px-4 py-2.5 rounded-lg border shadow-sm transition-colors text-zinc-700 dark:text-zinc-200">
              <Download className="w-4 h-4" />
              CSV
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-muted-foreground flex items-center font-medium mr-2">Status do Serviço:</span>
        {['confirmed', 'completed', 'no_show', 'pending', 'canceled'].map(status => (
          <button 
            key={status} 
            onClick={() => handleStatusToggle(status)}
            className={`px-3 py-1 rounded-full border transition-colors capitalize ${filterState.status.includes(status) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-gray-200 dark:border-zinc-700 hover:border-gray-500'}`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
