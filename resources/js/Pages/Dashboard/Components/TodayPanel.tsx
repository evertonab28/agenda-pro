import { TodayAppointment } from './types';
import { SectionCard } from '@/components/Shared/SectionCard';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  appointments?: TodayAppointment[];
  atRiskCount?: number;
}

const INDICATOR_COLORS = [
  '#22c55e', // Verde
  '#3b82f6', // Azul
  '#f59e0b', // Laranja
  '#a855f7', // Roxo
  '#ef4444', // Vermelho
];

export function TodayPanel({ appointments = [], atRiskCount = 0 }: Props) {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const totalRev = safeAppointments
    .filter(a => a?.status === 'confirmed' || a?.status === 'completed')
    .reduce((s, a) => s + (a?.value || 0), 0);

  const formattedRev = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    maximumFractionDigits: 0 
  }).format(totalRev);

  const today = new Date();
  const weekDay = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const capitalizedDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);

  const headerAction = (
    <div className="bg-[#1e3a5f] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md">
      {safeAppointments.length} agendados
    </div>
  );

  return (
    <SectionCard
      title="Agenda do dia"
      subtitle={`Hoje, ${capitalizedDay}`}
      headerAction={headerAction}
      className="border border-border/60 shadow-xl shadow-primary/5 bg-[#f3f6fb] dark:bg-zinc-950/20"
      titleClassName="text-xl font-black text-[#1e293b] dark:text-foreground tracking-tight normal-case"
      subtitleClassName="text-xs font-bold text-muted-foreground/60 mb-0.5"
      noPadding
    >
      <div className="p-6 flex flex-col h-full min-h-0">
        {/* KPI Row - Slimmer & Premium */}
        <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
            <div className="bg-white dark:bg-zinc-900/40 px-4 py-3.5 rounded-2xl border border-border/20 shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Receita hoje</p>
                <p className="text-lg font-black text-[#1e293b] dark:text-foreground tracking-tight">{formattedRev}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900/40 px-4 py-3.5 rounded-2xl border border-border/20 shadow-sm transition-transform hover:scale-[1.02]">
                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Em risco</p>
                <p className="text-lg font-black text-[#1e293b] dark:text-foreground tracking-tight">{atRiskCount || 0} clientes</p>
            </div>
        </div>

        {/* Appointment List - With explicit GAP for spacing */}
        <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar px-1 pb-12 min-h-0">
            {safeAppointments.length === 0 ? (
                <div className="py-10 px-4 text-center text-sm text-muted-foreground font-medium bg-white/40 dark:bg-transparent rounded-2xl border border-dashed border-border/40">
                    Nenhum agendamento para hoje.
                </div>
            ) : (
                safeAppointments.map((appt, idx) => {
                    if (!appt) return null;
                    const color = INDICATOR_COLORS[idx % INDICATOR_COLORS.length];
                    const isCompleted = appt.status === 'completed' || appt.status === 'confirmed';
                    
                    return (
                        <div
                            key={appt.id || idx}
                            className="group flex items-center gap-3 bg-white dark:bg-zinc-900/40 py-3 px-4 rounded-xl border border-border/40 shadow-sm transition-all hover:shadow-md hover:border-primary/20 relative overflow-hidden mx-0.5"
                        >
                            {/* Slim Vertical Indicator */}
                            <div 
                                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all group-hover:w-1"
                                style={{ backgroundColor: color }}
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0 pl-1">
                                <p className="font-bold text-[13px] text-[#1e293b] dark:text-foreground truncate tracking-tight">
                                    {appt.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground/60 font-medium truncate">
                                    {appt.service}
                                </p>
                            </div>

                            {/* Right Side */}
                            <div className="flex items-center gap-3">
                                <span className="text-[13px] font-black text-[#1e293b] dark:text-foreground/80 tracking-tight">
                                    {appt.time}
                                </span>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                    isCompleted 
                                        ? 'bg-success/10 text-success' 
                                        : 'bg-muted text-muted-foreground/20'
                                }`}>
                                    <CheckCircle2 size={12} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </SectionCard>
  );
}
