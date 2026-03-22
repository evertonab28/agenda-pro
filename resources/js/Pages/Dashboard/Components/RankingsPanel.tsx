import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RankingService, RankingCustomer } from './types';

const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  services: RankingService[];
  customers: RankingCustomer[];
}

export function RankingsPanel({ services, customers }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 col-span-full xl:col-span-4">
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
                <li key={svc.service_id} className="flex justify-between items-center p-3 sm:px-6 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center min-w-[24px] h-6 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-gray-500 dark:text-gray-400">{i + 1}</span>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[130px] sm:max-w-[180px]">{svc.service_name}</p>
                      <p className="text-xs text-muted-foreground">{svc.total_appointments} agendamentos</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{money(svc.total_revenue)}</div>
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
                <li key={c.customer_id} className="flex justify-between items-center p-3 sm:px-6 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center min-w-[24px] h-6 rounded-full bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-gray-500 dark:text-gray-400">{i + 1}</span>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[130px] sm:max-w-[180px]">{c.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{c.total_appointments} agendamentos</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{money(c.total_spent)}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
