import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CreditCard, MessageSquare, ArrowRight } from 'lucide-react';

interface Action {
  id: number;
  customer_name: string;
  amount: number;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  action_label: string;
  action_type: 'payment_link' | 'whatsapp_reminder' | 'confirm_payment';
}

interface DailyActionsProps {
  actions: Action[];
}

export const DailyActions: React.FC<DailyActionsProps> = ({ actions }) => {
  if (!actions || actions.length === 0) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_link': return <CreditCard className="w-4 h-4" />;
      case 'whatsapp_reminder': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Card className="xl:col-span-12 border-none shadow-sm bg-linear-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" />
              Próximas Melhores Ações
            </CardTitle>
            <CardDescription>
              Ações recomendadas para aumentar a receita e reduzir inadimplência hoje.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400">
            {actions.length} Recomendações
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <div 
              key={`${action.action_type}-${action.id}`}
              className="group flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <Badge className={getPriorityColor(action.priority)}>
                  {action.priority === 'high' ? 'Crítico' : action.priority === 'medium' ? 'Importante' : 'Sugestão'}
                </Badge>
                <span className="text-xs font-medium text-slate-500">Vence: {action.due_date}</span>
              </div>
              
              <div className="mb-4">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{action.customer_name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-tight">
                  {action.suggestion}
                </p>
                <div className="mt-2 text-lg font-black text-indigo-600 dark:text-indigo-400">
                  R$ {action.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <Button 
                variant="default" 
                size="sm" 
                className="mt-auto w-full bg-slate-900 hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-colors"
              >
                {getIcon(action.action_type)}
                {action.action_label}
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
