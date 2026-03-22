import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Props {
  data: any[];
  onBarClick: (fullDate: string) => void;
}

export function DailySeriesChart({ data, onBarClick }: Props) {
  return (
    <Card className="shadow-sm col-span-full xl:col-span-7">
      <CardHeader>
        <CardTitle>Série Diária</CardTitle>
        <CardDescription>Agendamentos e Receita (R$) por dia (clique na barra para drill-down no dia)</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados de série para o período.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                // Read full_date from actual data since XAxis uses short 'date' format
                onBarClick(state.activePayload[0].payload.full_date);
              }
            }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-zinc-800" />
              <XAxis 
                dataKey="date" 
                className="text-[10px] text-muted-foreground" 
                tickLine={false} 
                axisLine={false}
                interval={Math.ceil(data.length / 10)}
              />
              <YAxis yAxisId="left" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="appointments" name="Agendamentos" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} className="cursor-pointer hover:opacity-80" />
              <Bar yAxisId="right" dataKey="revenue" name="Receita (R$)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} className="cursor-pointer hover:opacity-80" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
