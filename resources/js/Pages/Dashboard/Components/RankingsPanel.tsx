import { useState } from 'react';
import { RankingService, RankingCustomer } from './types';
import { SectionCard } from '@/components/Shared/SectionCard';
import { Trophy, Users, Palette } from 'lucide-react';

interface Props {
  services?: RankingService[];
  customers?: RankingCustomer[];
}

export function RankingsPanel({ services = [], customers = [] }: Props) {
  const [tab, setTab] = useState<'services' | 'customers'>('services');

  const isServices = tab === 'services';
  const data = isServices ? services : customers;

  const max = data.length === 0 ? 1 : Math.max(
    ...data.map(d => isServices ? (d as RankingService).total_revenue : (d as RankingCustomer).total_spent),
    1
  );

  const tabs: { key: 'services' | 'customers'; label: string; icon: any }[] = [
    { key: 'services', label: 'Top Serviços', icon: Palette },
    { key: 'customers', label: 'Top Clientes', icon: Users },
  ];

  return (
    <SectionCard
      title="Ranking de Performance"
      subtitle="Serviços e clientes que mais impulsionam seu negócio"
      headerAction={
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer border-none ${
                  active 
                    ? 'bg-card text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      }
    >
      {data.length === 0 ? (
        <div className="p-8 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Nenhum dado de performance no período.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((item, i) => {
            const v = isServices
              ? (item as RankingService).total_revenue
              : (item as RankingCustomer).total_spent;
            const name = isServices
              ? (item as RankingService).service_name
              : (item as RankingCustomer).customer_name;
            const sub = isServices
              ? `${(item as RankingService).total_appointments} agendamentos`
              : `${(item as RankingCustomer).total_appointments} visitas realizadas`;
            const pct = (v / max) * 100;

            return (
              <div key={i} className="group">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-medium text-muted-foreground/40 font-mono tracking-tighter">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-base text-primary tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                        {sub}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--primary), #818cf8)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
