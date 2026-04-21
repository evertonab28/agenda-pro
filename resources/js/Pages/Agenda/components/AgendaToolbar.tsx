// resources/js/Pages/Agenda/components/AgendaToolbar.tsx
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ProfessionalFilter } from './ProfessionalFilter';
import type { Professional } from '../types';

interface AgendaToolbarProps {
  currentView: string;
  currentDate: Date;
  professionals: Professional[];
  visibleProfessionalIds: number[];
  onViewChange: (view: string) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onToggleProfessional: (id: number) => void;
  onCreateClick: () => void;
  isMobile: boolean;
  onMobileProfessionalSelect: (id: number) => void;
}

const VIEW_LABELS: Record<string, string> = {
  resourceTimeGridWeek: 'Semana',
  resourceTimeGridDay: 'Dia',
  dayGridMonth: 'Mês',
  listWeek: 'Lista',
};

const DESKTOP_VIEWS = ['resourceTimeGridWeek', 'resourceTimeGridDay', 'dayGridMonth', 'listWeek'];
const MOBILE_VIEWS = ['listWeek', 'resourceTimeGridDay', 'dayGridMonth'];

function formatHeader(date: Date, view: string): string {
  if (view === 'resourceTimeGridWeek' || view === 'listWeek') {
    return format(date, "MMMM yyyy", { locale: ptBR });
  }
  if (view === 'resourceTimeGridDay') {
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  }
  return format(date, "MMMM yyyy", { locale: ptBR });
}

export function AgendaToolbar({
  currentView,
  currentDate,
  professionals,
  visibleProfessionalIds,
  onViewChange,
  onNavigate,
  onToggleProfessional,
  onCreateClick,
  isMobile,
  onMobileProfessionalSelect,
}: AgendaToolbarProps) {
  const views = isMobile ? MOBILE_VIEWS : DESKTOP_VIEWS;

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Navegação */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onNavigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate('today')}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => onNavigate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium capitalize ml-1">
            {formatHeader(currentDate, currentView)}
          </span>
        </div>

        {/* Seletor de view */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                currentView === v
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Botão criar */}
        <Button onClick={onCreateClick} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo
        </Button>
      </div>

      {/* Filtro de profissionais */}
      {professionals.length > 1 && (
        <ProfessionalFilter
          professionals={professionals}
          visibleIds={visibleProfessionalIds}
          onToggle={onToggleProfessional}
          mobile={isMobile}
          onMobileSelect={onMobileProfessionalSelect}
        />
      )}
    </div>
  );
}
