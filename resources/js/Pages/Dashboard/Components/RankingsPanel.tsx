import { useState } from 'react';
import { RankingService, RankingCustomer } from './types';

interface Props {
  services: RankingService[];
  customers: RankingCustomer[];
}

export function RankingsPanel({ services, customers }: Props) {
  const [tab, setTab] = useState<'services' | 'customers'>('services');

  const isServices = tab === 'services';
  const data = isServices ? services : customers;

  const max = data.length === 0 ? 1 : Math.max(
    ...data.map(d => isServices ? (d as RankingService).total_revenue : (d as RankingCustomer).total_spent),
    1
  );

  const tabs: { key: 'services' | 'customers'; label: string }[] = [
    { key: 'services', label: 'Top Serviços' },
    { key: 'customers', label: 'Top Clientes' },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden col-span-full xl:col-span-12">
      {/* Tab bar */}
      <div className="px-5 pt-3.5 border-b border-border/60 flex gap-1">
        {tabs.map(({ key, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'text-xs font-semibold px-3.5 py-[7px] rounded-t-lg cursor-pointer transition-all duration-150 border-b-2',
                active
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'bg-transparent text-muted-foreground border-transparent',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      {data.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Nenhum dado no período.</p>
      ) : (
        <div className="p-5 space-y-3">
          {data.map((item, i) => {
            const v = isServices
              ? (item as RankingService).total_revenue
              : (item as RankingCustomer).total_spent;
            const name = isServices
              ? (item as RankingService).service_name
              : (item as RankingCustomer).customer_name;
            const sub = isServices
              ? `${(item as RankingService).total_appointments} atend.`
              : `${(item as RankingCustomer).total_appointments} visitas`;
            const pct = (v / max) * 100;

            return (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1">
                  <span>
                    <span className="text-[11px] text-muted-foreground mr-1.5">#{i + 1}</span>
                    <span className="text-sm font-semibold text-foreground">{name}</span>
                  </span>
                  <div className="text-right">
                    <span className="font-display text-sm font-bold text-primary">
                      R$&nbsp;{v.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{sub}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1 rounded-full bg-border/60 mt-1">
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 9999,
                      background: 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 50%, transparent))',
                      transition: 'width .4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
