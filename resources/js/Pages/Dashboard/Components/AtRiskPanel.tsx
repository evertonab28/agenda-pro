import { AtRiskCustomer } from './types';

interface Props {
  customers: AtRiskCustomer[];
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

export function AtRiskPanel({ customers }: Props) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-bold text-foreground">Clientes em Risco</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sem agendamento recente</p>
        </div>
        <span
          className="font-display text-lg font-extrabold"
          style={{ color: 'var(--destructive-text)' }}
        >
          {customers.length}
        </span>
      </div>

      {/* List */}
      {customers.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente em risco.
        </p>
      ) : (
        <>
          {customers.map(customer => {
            const days = customer.days_without_appointment;
            const color = riskColor(days);
            const bg = riskBg(days);
            return (
              <div
                key={customer.id}
                className="flex items-center gap-3 px-5 py-2.5 border-b border-border/40 last:border-0"
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
                  <p className="text-[13px] font-semibold text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.last_service}</p>
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
          })}

          {/* Footer button */}
          <div className="px-5 py-2.5">
            <button className="w-full py-2 rounded-lg text-xs font-semibold text-primary bg-primary/10 cursor-pointer border-none">
              Ver todos os clientes em risco
            </button>
          </div>
        </>
      )}
    </div>
  );
}
