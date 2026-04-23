import { useId } from 'react';

interface SparklineProps {
  data: number[];
  color: string;
  fill?: boolean;
}

export function Sparkline({ data, color, fill = true }: SparklineProps) {
  const uid = useId();
  const gradId = `sg-${uid.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  if (!data || data.length === 0) return null;

  const W = 80, H = 32;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [
    data.length > 1 ? (i / (data.length - 1)) * W : W / 2,
    H - (v / max) * H * 0.85 - 2,
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
