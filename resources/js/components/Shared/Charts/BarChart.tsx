import { useState } from 'react';

export interface ChartDataPoint {
  date: string;
  full_date: string;
  value: number;
}

interface BarChartProps {
  data: ChartDataPoint[];
  color?: string;
  onBarClick?: (date: string) => void;
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  color = 'var(--primary)',
  onBarClick,
  height = 140,
  formatValue = (v) => String(v)
}: BarChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const vals = data.map(d => d.value);
  const max = Math.max(...vals, 1);

  const W = 100;
  const H = height;
  const barW = 28;
  const gap = (W * 6 - barW * 7) / 6;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W * 7} ${H + 20}`}
        style={{ width: '100%', height: H + 20 }}
      >
        {data.map((d, i) => {
          const x = i * (barW + gap) + gap / 2;
          const v = d.value;
          const bh = (v / max) * H * 0.88;
          const y = H - bh;
          const isHov = hover === i;
          
          let label = '';
          try {
             label = new Date(d.full_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
          } catch (e) {
             label = d.date;
          }

          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onBarClick?.(d.full_date)}
              className="group"
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
            >
              {/* hit area */}
              <rect
                x={x}
                y={0}
                width={barW}
                height={H}
                rx="6"
                fill={isHov ? `color-mix(in srgb, ${color} 10%, transparent)` : 'transparent'}
              />
              {/* bar */}
              <rect
                x={x + 2}
                y={y}
                width={barW - 4}
                height={bh}
                rx="5"
                fill={isHov ? color : `color-mix(in srgb, ${color} 25%, transparent)`}
                className="transition-all duration-200"
              />
              {/* tooltip value on hover */}
              {isHov && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill={color}
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  {formatValue(v)}
                </text>
              )}
              {/* day label */}
              <text
                x={x + barW / 2}
                y={H + 14}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="10"
                fontFamily="sans-serif"
                className="font-medium"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
