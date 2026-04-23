import { TodayAppointment } from './types';
import { StatusPill } from '@/components/Shared/StatusPill';
import { SectionCard } from '@/components/Shared/SectionCard';
import { Link } from '@inertiajs/react';

interface Props {
  appointments?: TodayAppointment[];
}

const initials = (name: string) =>
  name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');

const mapStatusToVariant = (status: string): any => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'completed': return 'info';
    case 'no_show': return 'destructive';
    case 'canceled': return 'muted';
    default: return 'warning';
  }
};

const mapStatusToLabel = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'Confirmado';
    case 'completed': return 'Concluído';
    case 'no_show': return 'No-Show';
    case 'canceled': return 'Cancelado';
    default: return 'Pendente';
  }
};

export function TodayPanel({ appointments = [] }: Props) {
  const confirmed = appointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
  const totalRev = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((s, a) => s + a.value, 0);

  const formattedRev = totalRev.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const headerAction = (
    <Link
      href={route('agenda')}
      className="text-xs font-semibold text-primary bg-primary/10 border-none rounded-lg px-3 py-1.5 cursor-pointer no-underline"
    >
      + Agendar
    </Link>
  );

  return (
    <SectionCard
      title="Agenda de Hoje"
      subtitle={`${confirmed} confirmados · ${formattedRev} esperado`}
      headerAction={headerAction}
      noPadding
    >
      <div className="overflow-y-auto max-h-80 custom-scrollbar">
        {appointments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground font-medium">
            Nenhum agendamento para hoje.
          </p>
        ) : (
          appointments.map(appt => (
            <div
              key={appt.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-display text-xs font-bold text-primary flex-shrink-0">
                {initials(appt.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{appt.name}</p>
                <p className="text-xs text-muted-foreground truncate">{appt.service}</p>
              </div>

              {/* Right side */}
              <div className="text-right flex-shrink-0">
                <p className="font-display text-xs font-bold text-foreground/70 mb-1">{appt.time}</p>
                <StatusPill
                  variant={mapStatusToVariant(appt.status)}
                  label={mapStatusToLabel(appt.status)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

