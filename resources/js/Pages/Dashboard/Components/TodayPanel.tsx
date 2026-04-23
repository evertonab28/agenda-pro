import { TodayAppointment } from './types';
import { StatusPill } from './StatusPill';
import { Link } from '@inertiajs/react';

interface Props {
  appointments: TodayAppointment[];
}

const initials = (name: string) =>
  name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');

export function TodayPanel({ appointments = [] }: Props) {
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const totalRev = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((s, a) => s + a.value, 0);

  const formattedRev = totalRev.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-bold text-foreground">Agenda de Hoje</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {confirmed} confirmados · {formattedRev} esperado
          </p>
        </div>
        <Link
          href={route('agenda')}
          className="text-xs font-semibold text-primary bg-primary/10 border-none rounded-lg px-3 py-1.5 cursor-pointer no-underline"
        >
          + Agendar
        </Link>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 max-h-80">
        {appointments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum agendamento para hoje.
          </p>
        ) : (
          appointments.map(appt => (
            <div
              key={appt.id}
              className="flex items-center gap-3 px-5 py-2.5 border-b border-border/40 last:border-0"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-display text-xs font-bold text-primary flex-shrink-0">
                {initials(appt.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{appt.name}</p>
                <p className="text-xs text-muted-foreground">{appt.service}</p>
              </div>

              {/* Right side */}
              <div className="text-right flex-shrink-0">
                <p className="font-display text-xs font-bold text-foreground/70">{appt.time}</p>
                <StatusPill status={appt.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
