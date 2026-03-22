import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Cards, Delta } from './types';

const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const DeltaIndicator = ({ delta, reverseColors = false }: { delta: Delta, reverseColors?: boolean }) => {
  if (!delta || delta.percentage === 0) {
    return <div className="flex items-center text-xs text-muted-foreground"><Minus className="w-3 h-3 mr-1" /> 0%</div>;
  }
  const isPositive = delta.absolute > 0;
  const isGood = reverseColors ? !isPositive : isPositive;
  const colorClass = isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center text-xs font-medium ${colorClass}`}>
      <Icon className="w-3 h-3 mr-1" />
      {delta.percentage}%
    </div>
  );
};

export function KpiCards({ cards, deltas }: { cards: Cards, deltas: Record<keyof Cards, Delta> }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos Totais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold">{cards.appointments_total}</div>
            <DeltaIndicator delta={deltas.appointments_total} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Confirmação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{cards.confirmation_rate}%</div>
            <DeltaIndicator delta={deltas.confirmation_rate} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de No-show</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{cards.no_show_rate}%</div>
            <DeltaIndicator delta={deltas.no_show_rate} reverseColors={true} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary-foreground/80">Receita Paga</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold">{money(cards.paid_amount)}</div>
              <p className="text-xs text-primary-foreground/80 mt-1">
                +{money(cards.pending_amount)} previstos
              </p>
            </div>
            <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
              <DeltaIndicator delta={deltas.paid_amount} />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
