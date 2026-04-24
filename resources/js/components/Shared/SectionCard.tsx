import { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string | ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
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
  titleClassName = '',
  subtitleClassName = '',
  noPadding = false,
}: SectionCardProps) {
  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full ${className}`}>
      {/* Header */}
      {(title || headerAction) && (
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex flex-col min-w-0">
            {subtitle && (
              <div className={`text-sm text-muted-foreground font-medium truncate opacity-70 ${subtitleClassName}`}>
                {subtitle}
              </div>
            )}
            {title && (
              <p className={`font-display text-base font-black text-foreground tracking-tight truncate ${titleClassName}`}>
                {title}
              </p>
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
      <div className={`flex-1 ${noPadding ? '' : 'p-6'} ${contentClassName}`}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}
