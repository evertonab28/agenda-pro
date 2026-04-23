import { useState } from 'react';
import { CalendarCheck, CheckCircle2, AlertCircle, Wallet, AlertTriangle } from 'lucide-react';
import { Cards, Delta, TimeseriesItem } from './types';
import { Sparkline } from './Sparkline';

const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface TrendBadgeProps {
  delta: Delta;
  reverseColors?: boolean;
}

function TrendBadge({ delta, reverseColors = false }: TrendBadgeProps) {
  if (!delta || delta.percentage === 0) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--muted-foreground)',
          background: 'var(--muted)',
          padding: '3px 8px',
          borderRadius: 999,
          display: 'inline-block',
        }}
      >
        0%
      </span>
    );
  }

  const isPositive = delta.absolute > 0;
  const isGood = reverseColors ? !isPositive : isPositive;

  const color = isGood ? 'var(--success-text)' : 'var(--destructive-text)';
  const bg = isGood ? 'var(--success-bg)' : 'var(--destructive-bg)';
  const arrow = isPositive ? '↑' : '↓';

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        background: bg,
        padding: '3px 8px',
        borderRadius: 999,
        display: 'inline-block',
      }}
    >
      {arrow} {delta.percentage}%
    </span>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: Delta;
  reverseColors?: boolean;
  sparkData?: number[];
  color: string;
  icon: React.ReactNode;
}

function KpiCard({ label, value, sub, delta, reverseColors, sparkData, color, icon }: KpiCardProps) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="bg-card border rounded-2xl p-5 transition-all duration-200 cursor-default"
      style={{
        borderColor: hov ? color + '44' : 'var(--border)',
        boxShadow: hov ? `0 8px 32px ${color}18` : 'none',
        background: hov ? 'color-mix(in srgb, var(--muted) 20%, transparent)' : undefined,
      }}
    >
      {/* Header row: icon + trend badge */}
      <div className="flex justify-between items-start mb-[14px]">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: color + '22',
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {delta && <TrendBadge delta={delta} reverseColors={reverseColors} />}
      </div>

      {/* Label */}
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[.06em] mb-1">
        {label}
      </div>

      {/* Value */}
      <div className="font-display text-[26px] font-extrabold tracking-tight leading-tight text-foreground">
        {value}
      </div>

      {/* Subtext */}
      {sub && (
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      )}

      {/* Sparkline */}
      {sparkData && sparkData.length > 0 && (
        <div className="mt-[10px]">
          <Sparkline data={sparkData} color={color} fill />
        </div>
      )}
    </div>
  );
}

interface KpiCardsProps {
  cards: Cards;
  deltas: Record<keyof Cards, Delta>;
  timeseries: TimeseriesItem[];
  atRiskCount: number;
}

export function KpiCards({ cards, deltas, timeseries = [], atRiskCount = 0 }: KpiCardsProps) {
  if (!cards || !deltas) return null;
  const safeTimeseries = timeseries ?? [];
  const appointmentsSpark = safeTimeseries.map((d) => d.appointments);
  const revenueSpark = safeTimeseries.map((d) => d.revenue);

  return (
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        label="Agendamentos"
        value={cards.appointments_total}
        delta={deltas.appointments_total}
        sparkData={appointmentsSpark}
        color="var(--primary)"
        icon={<CalendarCheck size={18} />}
      />

      <KpiCard
        label="Confirmados"
        value={`${cards.confirmation_rate}%`}
        delta={deltas.confirmation_rate}
        color="var(--success)"
        icon={<CheckCircle2 size={18} />}
      />

      <KpiCard
        label="No-Show"
        value={`${cards.no_show_rate}%`}
        delta={deltas.no_show_rate}
        reverseColors
        color="var(--destructive)"
        icon={<AlertCircle size={18} />}
      />

      <KpiCard
        label="Receita Paga"
        value={money(cards.paid_amount)}
        sub={`+${money(cards.pending_amount)} previstos`}
        delta={deltas.paid_amount}
        sparkData={revenueSpark}
        color="var(--primary)"
        icon={<Wallet size={18} />}
      />

      <KpiCard
        label="Clientes em Risco"
        value={atRiskCount}
        color="var(--warning)"
        icon={<AlertTriangle size={18} />}
      />
    </section>
  );
}
