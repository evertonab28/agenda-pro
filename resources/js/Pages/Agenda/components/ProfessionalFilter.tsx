// resources/js/Pages/Agenda/components/ProfessionalFilter.tsx
import { PROFESSIONAL_COLORS } from '../utils/calendarMappers';
import type { Professional } from '../types';

interface ProfessionalFilterProps {
  professionals: Professional[];
  visibleIds: number[];
  onToggle: (id: number) => void;
  mobile?: boolean; // se true, renderiza <select>
  onMobileSelect?: (id: number) => void;
}

export function ProfessionalFilter({
  professionals,
  visibleIds,
  onToggle,
  mobile = false,
  onMobileSelect,
}: ProfessionalFilterProps) {
  if (mobile) {
    const selectedId = visibleIds[0] ?? professionals[0]?.id;
    return (
      <select
        className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-900"
        value={selectedId}
        onChange={(e) => onMobileSelect?.(Number(e.target.value))}
      >
        {professionals.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {professionals.map((p, index) => {
        const color = PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length];
        const visible = visibleIds.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
              visible ? 'opacity-100 shadow-md scale-105' : 'opacity-30 grayscale hover:opacity-50'
            }`}
            style={{ borderColor: color, color, backgroundColor: `${color}12` }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: color }}
            />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
