import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string | ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-6 text-muted-foreground/40">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-black text-foreground uppercase tracking-widest mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground font-medium max-w-[280px] leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
