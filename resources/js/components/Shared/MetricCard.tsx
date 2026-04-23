import { ReactNode, useState } from 'react';

export interface MetricDelta {
  absolute: number;
  percentage: number;
}

interface TrendBadgeProps {
  delta: MetricDelta;
  reverseColors?: boolean;
}

function TrendBadge({ delta, reverseColors = false }: TrendBadgeProps) {
  if (!delta || delta.percentage === 0) {
    return (
      <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block">
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
      className="text-[11px] font-bold px-2 py-0.5 rounded-full inline-block transition-colors duration-200"
      style={{ color, backgroundColor: bg }}
    >
      {arrow} {Math.abs(delta.percentage)}%
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string | ReactNode;
  delta?: MetricDelta;
  reverseColors?: boolean;
  sparkline?: ReactNode;
  color?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  delta,
  reverseColors,
  sparkline,
  color = 'var(--primary)',
  icon,
  className = '',
}: MetricCardProps) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`bg-card border rounded-2xl p-5 transition-all duration-300 cursor-default flex flex-col h-full ${className}`}
      style={{
        borderColor: hov ? `${color}44` : 'var(--border)',
        boxShadow: hov ? `0 8px 32px ${color}18` : 'none',
        background: hov ? 'color-mix(in srgb, var(--muted) 20%, transparent)' : undefined,
      }}
    >
      {/* Header row: icon + trend badge */}
      <div className="flex justify-between items-start mb-4">
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${color}22`, color }}
          >
            {icon}
          </div>
        )}
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
        <div className="text-xs text-muted-foreground mt-1.5 font-medium">{sub}</div>
      )}

      {/* Sparkline */}
      {sparkline && (
        <div className="mt-auto pt-4">
          {sparkline}
        </div>
      )}
    </div>
  );
}
