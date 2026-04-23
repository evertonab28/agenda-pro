import { TodayAppointment } from './types';

interface StatusPillProps {
  status: TodayAppointment['status'];
}

const STATUS_MAP: Record<TodayAppointment['status'], { color: string; bg: string; label: string }> = {
  confirmed: { color: 'var(--success-text)', bg: 'var(--success-bg)', label: 'Confirmado' },
  completed: { color: 'var(--info-text)', bg: 'var(--info-bg)', label: 'Concluído' },
  pending: { color: 'var(--warning-text)', bg: 'var(--warning-bg)', label: 'Pendente' },
  noshow: { color: 'var(--destructive-text)', bg: 'var(--destructive-bg)', label: 'No-Show' },
  cancelled: { color: 'var(--muted-foreground)', bg: 'var(--muted)', label: 'Cancelado' },
};

export function StatusPill({ status }: StatusPillProps) {
  const { color, bg, label } = STATUS_MAP[status];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}
