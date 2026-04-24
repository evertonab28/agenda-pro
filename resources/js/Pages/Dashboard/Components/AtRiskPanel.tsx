import { AtRiskCustomer } from './types';
import { Link } from '@inertiajs/react';
import { SectionCard } from '@/components/Shared/SectionCard';
import { UserX } from 'lucide-react';

interface Props {
  customers?: AtRiskCustomer[];
}

const initials = (name: string) =>
  name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');

function riskColor(days: number): string {
  if (days >= 90) return 'var(--destructive)';
  if (days >= 60) return 'var(--warning)';
  return 'var(--info)';
}

export function AtRiskPanel({ customers = [] }: Props) {
  const footer = (
    <Link
      href={route('crm.segment', 'Em Risco')}
      className="w-full py-3 rounded-xl text-xs font-black text-primary bg-primary/5 cursor-pointer border border-primary/10 no-underline flex items-center justify-center transition-all hover:bg-primary/10 uppercase tracking-widest"
    >
      Ver Gestão de Retenção
    </Link>
  );

  return (
    <SectionCard
      title="Retenção de Clientes"
      subtitle="Clientes que não retornam há algum tempo"
      headerAction={
        <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20">
          <UserX className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs font-black text-destructive tracking-widest">
            {customers.length} EM RISCO
          </span>
        </div>
      }
      footer={footer}
      noPadding
    >
      <div className="flex flex-col">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
             <p className="text-sm text-muted-foreground font-medium opacity-60 italic">Nenhum cliente em risco no momento.</p>
          </div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto custom-scrollbar pb-4">
            {customers.map(customer => {
              const days = customer.days_without_appointment;
              const color = riskColor(days);
              
              return (
                <div
                  key={customer.id}
                  className="flex items-center gap-4 px-6 py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 shadow-inner transition-transform group-hover:scale-105"
                    style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    {initials(customer.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-foreground truncate uppercase tracking-tight">{customer.name}</p>
                    <p className="text-xs text-muted-foreground font-medium truncate opacity-70 mt-0.5">{customer.last_service}</p>
                  </div>

                  {/* Days badge */}
                  <div className="flex flex-col items-end">
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 uppercase tracking-widest border shadow-sm"
                      style={{ color, backgroundColor: `${color}10`, borderColor: `${color}20` }}
                    >
                      {days} dias
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter mt-1">sem retorno</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
