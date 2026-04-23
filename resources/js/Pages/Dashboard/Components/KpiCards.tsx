import { CalendarCheck, CheckCircle2, AlertCircle, Wallet, AlertTriangle } from 'lucide-react';
import { Cards, Delta, TimeseriesItem } from './types';
import { MetricCard } from '@/components/Shared/MetricCard';
import { Sparkline } from '@/components/Shared/Charts/Sparkline';

const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface KpiCardsProps {
  cards: Cards;
  deltas: Record<keyof Cards, Delta>;
  timeseries: TimeseriesItem[];
  atRiskCount: number;
}

export function KpiCards({ cards, deltas, timeseries = [], atRiskCount = 0 }: KpiCardsProps) {
  if (!cards || !deltas) return null;

  const safeTimeseries = timeseries ?? [];
  const appointmentsSpark = <Sparkline data={safeTimeseries.map((d) => d.appointments)} color="var(--primary)" />;
  const revenueSpark = <Sparkline data={safeTimeseries.map((d) => d.revenue)} color="var(--primary)" />;

  return (
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-5 mb-6">
      <MetricCard
        label="Agendamentos"
        value={cards.appointments_total}
        delta={deltas.appointments_total}
        sparkline={appointmentsSpark}
        color="var(--primary)"
        icon={<CalendarCheck size={18} />}
      />

      <MetricCard
        label="Confirmados"
        value={`${cards.confirmation_rate}%`}
        delta={deltas.confirmation_rate}
        color="var(--success)"
        icon={<CheckCircle2 size={18} />}
      />

      <MetricCard
        label="No-Show"
        value={`${cards.no_show_rate}%`}
        delta={deltas.no_show_rate}
        reverseColors
        color="var(--destructive)"
        icon={<AlertCircle size={18} />}
      />

      <MetricCard
        label="Receita Paga"
        value={money(cards.paid_amount)}
        sub={`+${money(cards.pending_amount)} previstos`}
        delta={deltas.paid_amount}
        sparkline={revenueSpark}
        color="var(--primary)"
        icon={<Wallet size={18} />}
      />

      <MetricCard
        label="Clientes em Risco"
        value={atRiskCount}
        color="var(--warning)"
        icon={<AlertTriangle size={18} />}
      />
    </section>
  );
}
