// resources/js/Pages/Agenda/components/AgendaToolbar.tsx
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navegação e Título */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/40">
            <Button variant="ghost" size="icon" onClick={() => onNavigate('prev')} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('today')} className="h-8 px-3 text-[11px] font-bold uppercase tracking-wider">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onNavigate('next')} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary opacity-50" />
            <span className="text-sm font-bold capitalize text-foreground">
              {formatHeader(currentDate, currentView)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de view */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/40">
            {views.map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  currentView === v
                    ? 'bg-card shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>

          {/* Botão criar */}
          <Button onClick={onCreateClick} size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10 h-9 px-4">
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Filtro de profissionais */}
      {professionals.length > 1 && (
        <div className="pt-3 border-t border-border/40">
          <ProfessionalFilter
            professionals={professionals}
            visibleIds={visibleProfessionalIds}
            onToggle={onToggleProfessional}
            mobile={isMobile}
            onMobileSelect={onMobileProfessionalSelect}
          />
        </div>
      )}
    </div>
  );
}
