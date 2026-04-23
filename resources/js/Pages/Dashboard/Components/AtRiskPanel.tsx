import { AtRiskCustomer } from './types';
import { Link } from '@inertiajs/react';
import { SectionCard } from '@/Components/Shared/SectionCard';

interface Props {
  customers?: AtRiskCustomer[];
}

const initials = (name: string) =>
  name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');

function riskColor(days: number): string {
  if (days >= 90) return 'var(--destructive-text)';
  if (days >= 60) return 'var(--warning-text)';
  return 'var(--info-text)';
}

function riskBg(days: number): string {
  if (days >= 90) return 'var(--destructive-bg)';
  if (days >= 60) return 'var(--warning-bg)';
  return 'var(--info-bg)';
}

export function AtRiskPanel({ customers = [] }: Props) {
  const footer = (
    <Link
      href={route('crm.segment', 'Em Risco')}
      className="w-full py-2 rounded-lg text-xs font-semibold text-primary bg-primary/10 cursor-pointer border-none no-underline flex items-center justify-center transition-colors hover:bg-primary/20"
    >
      Ver todos os clientes em risco
    </Link>
  );

  return (
    <SectionCard
      title="Clientes em Risco"
      subtitle="Sem agendamento recente"
      headerAction={
        <span className="font-display text-lg font-extrabold text-destructive">
          {customers.length}
        </span>
      }
      footer={footer}
      noPadding
    >
      <div className="flex flex-col">
        {customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground font-medium">
            Nenhum cliente em risco.
          </p>
        ) : (
          customers.map(customer => {
            const days = customer.days_without_appointment;
            const color = riskColor(days);
            const bg = riskBg(days);
            return (
              <div
                key={customer.id}
                className="flex items-center gap-3 px-5 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ color, backgroundColor: bg }}
                >
                  {initials(customer.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.last_service}</p>
                </div>

                {/* Days badge */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color, backgroundColor: bg }}
                >
                  {days}d
                </span>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}

