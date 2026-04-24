interface StatusPillProps {
  label: string;
  variant?: 'success' | 'warning' | 'destructive' | 'info' | 'muted' | 'primary';
  className?: string;
}

const VARIANTS = {
  success: { color: 'var(--success-text)', bg: 'var(--success-bg)' },
  warning: { color: 'var(--warning-text)', bg: 'var(--warning-bg)' },
  destructive: { color: 'var(--destructive-text)', bg: 'var(--destructive-bg)' },
  info: { color: 'var(--info-text)', bg: 'var(--info-bg)' },
  muted: { color: 'var(--muted-foreground)', bg: 'var(--muted)' },
  primary: { color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 15%, transparent)' },
};

export function StatusPill({ label, variant = 'muted', className = '' }: StatusPillProps) {
  const style = VARIANTS[variant] || VARIANTS.muted;

  return (
    <span
      className={`text-xs font-black px-2.5 py-1 rounded-full inline-flex items-center justify-center whitespace-nowrap uppercase tracking-widest ${className}`}
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {label}
    </span>
  );
}
