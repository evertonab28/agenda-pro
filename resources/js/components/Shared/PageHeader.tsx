import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 ${className}`}>
      <div>
        <h1 className="font-display text-[26px] font-black text-foreground tracking-tight leading-none uppercase">
          {title}
        </h1>
        {subtitle && (
          <div className="text-sm text-muted-foreground mt-2 font-medium opacity-70">
            {subtitle}
          </div>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}
