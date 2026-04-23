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
        <h1 className="font-display text-[22px] font-extrabold text-foreground tracking-tight leading-none">
          {title}
        </h1>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-1.5 font-medium">
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
