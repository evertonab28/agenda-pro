import { Calendar, Filter } from 'lucide-react';
import { FiltersState } from './types';
import { router } from '@inertiajs/react';

interface Props {
  filterState: FiltersState;
  setFilterState: (state: FiltersState) => void;
  exportUrl: string;
  baseUrl?: string;
  canExport?: boolean;
}

const STATUS_MAP: { value: string; label: string; color: string; colorDim: string }[] = [
  { value: 'confirmed',  label: 'Confirmado', color: 'var(--success)',           colorDim: 'var(--success-bg)' },
  { value: 'completed',  label: 'Concluído',  color: 'var(--info)',              colorDim: 'var(--info-bg)' },
  { value: 'no_show',    label: 'No-Show',    color: 'var(--destructive)',       colorDim: 'var(--destructive-bg)' },
  { value: 'pending',    label: 'Pendente',   color: 'var(--warning)',           colorDim: 'var(--warning-bg)' },
  { value: 'canceled',   label: 'Cancelado',  color: 'var(--muted-foreground)',  colorDim: 'var(--muted)' },
];

export function DashboardFilters({ filterState, setFilterState, exportUrl, baseUrl = '/dashboard', canExport = true }: Props) {
  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(baseUrl, filterState as any, { preserveState: true });
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
    <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2.5">
      {/* Left: status pills */}
      <span className="text-xs font-semibold text-muted-foreground mr-2">Status:</span>
      {STATUS_MAP.map(({ value, label, color, colorDim }) => {
        const active = filterState.status.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleStatusToggle(value)}
            className="text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer transition-all duration-150"
            style={
              active
                ? { borderColor: color, backgroundColor: colorDim, color }
                : { borderColor: 'var(--border)', backgroundColor: 'transparent', color: 'var(--muted-foreground)' }
            }
          >
            {active && <span>{'● '}</span>}{label}
          </button>
        );
      })}

      {/* Right: controls */}
      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        {/* Date range */}
        <div className="flex items-center gap-1.5 bg-muted border border-input rounded-[10px] px-3 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="date"
            className="text-xs bg-transparent border-none outline-none text-foreground/80 w-28"
            value={filterState.from || ''}
            onChange={e => setFilterState({ ...filterState, from: e.target.value })}
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="date"
            className="text-xs bg-transparent border-none outline-none text-foreground/80 w-28"
            value={filterState.to || ''}
            onChange={e => setFilterState({ ...filterState, to: e.target.value })}
          />
        </div>

        {/* Professional ID */}
        <input
          type="number"
          placeholder="Profissional ID"
          className="text-xs bg-muted border border-input rounded-[10px] px-3 py-1.5 outline-none text-foreground/80 w-32"
          value={filterState.professional_id || ''}
          onChange={e => setFilterState({ ...filterState, professional_id: e.target.value ? Number(e.target.value) : undefined })}
        />

        {/* Filtrar button */}
        <button
          type="submit"
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary rounded-[10px] px-3.5 py-1.5 cursor-pointer border-none"
        >
          <Filter className="w-3.5 h-3.5" /> Filtrar
        </button>

        {/* CSV button */}
        {canExport && (
          <a
            href={exportUrl}
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted border border-input rounded-[10px] px-3 py-1.5"
          >
            CSV
          </a>
        )}
      </div>
    </form>
  );
}
