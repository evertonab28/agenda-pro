import { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string | ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  subtitle,
  headerAction,
  footer,
  children,
  className = '',
  contentClassName = '',
  noPadding = false,
}: SectionCardProps) {
  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full ${className}`}>
      {/* Header */}
      {(title || headerAction) && (
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            {title && (
              <p className="font-display text-sm font-bold text-foreground truncate">
                {title}
              </p>
            )}
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-0.5 font-medium truncate">
                {subtitle}
              </div>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 ${noPadding ? '' : 'p-5'} ${contentClassName}`}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-5 py-3 border-t border-border/40 bg-muted/20 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}
