import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RankingService, RankingCustomer } from './types';

const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  services: RankingService[];
  customers: RankingCustomer[];
}

export function RankingsPanel({ services, customers }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 col-span-full xl:col-span-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
          <CardTitle className="text-base text-gray-700 dark:text-gray-300">Top 10 Serviços (Receita)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {services.length === 0 ? (
             <p className="p-6 text-center text-sm text-muted-foreground">Nenhum serviço utilizado no período.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
              {services.map((svc, i) => (
                <li key={svc.service_id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <span className="flex items-center justify-center min-w-[28px] h-7 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 mt-1">{i + 1}</span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-base truncate text-gray-800 dark:text-gray-200" title={svc.service_name}>{svc.service_name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{svc.total_appointments} agendamentos</p>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{money(svc.total_revenue)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800">
          <CardTitle className="text-base text-gray-700 dark:text-gray-300">Top 10 Clientes (Gastos Pagos)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
             <p className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente atendeu aos critérios.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
              {customers.map((c, i) => (
                <li key={c.customer_id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <span className="flex items-center justify-center min-w-[28px] h-7 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 mt-1">{i + 1}</span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-base truncate text-gray-800 dark:text-gray-200" title={c.customer_name}>{c.customer_name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{c.total_appointments} agendamentos</p>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{money(c.total_spent)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
