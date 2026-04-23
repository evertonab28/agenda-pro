import { useState } from 'react';
import { TimeseriesItem } from './types';

interface BarChartProps {
    data: TimeseriesItem[];
    metric: 'revenue' | 'appointments';
    onBarClick?: (date: string) => void;
}

export function BarChart({ data, metric, onBarClick }: BarChartProps) {
    const [hover, setHover] = useState<number | null>(null);

    const vals = data.map(d => metric === 'revenue' ? d.revenue : d.appointments);
    const max = Math.max(...vals, 1);

    const W = 100;
    const H = 140;
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
                    const v = metric === 'revenue' ? d.revenue : d.appointments;
                    const bh = (v / max) * H * 0.88;
                    const y = H - bh;
                    const isHov = hover === i;
                    const label = new Date(d.full_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });

                    return (
                        <g
                            key={i}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => onBarClick?.(d.full_date)}
                            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                        >
                            {/* hit area */}
                            <rect
                                x={x}
                                y={0}
                                width={barW}
                                height={H}
                                rx="6"
                                fill={isHov ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent'}
                            />
                            {/* bar */}
                            <rect
                                x={x + 2}
                                y={y}
                                width={barW - 4}
                                height={bh}
                                rx="5"
                                fill={isHov ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 15%, transparent)'}
                                style={{ transition: 'fill .15s' }}
                            />
                            {/* tooltip value on hover */}
                            {isHov && (
                                <text
                                    x={x + barW / 2}
                                    y={y - 6}
                                    textAnchor="middle"
                                    fill="var(--primary)"
                                    fontSize="10"
                                    fontWeight="700"
                                    fontFamily="sans-serif"
                                >
                                    {metric === 'revenue' ? `R$${v.toLocaleString('pt-BR')}` : v}
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
