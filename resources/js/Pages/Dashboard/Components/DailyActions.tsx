import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CreditCard, MessageSquare, ArrowRight } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Action {
  id: number;
  customer_name: string;
  customer_phone?: string;
  amount: number;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  action_label: string;
  action_type: 'payment_link' | 'whatsapp_reminder' | 'confirm_payment' | 'crm_action';
  url?: string;
}

interface DailyActionsProps {
  actions: Action[];
}

export const DailyActions: React.FC<DailyActionsProps> = ({ actions }) => {
  if (!actions || actions.length === 0) return null;

  const handleAction = (action: Action) => {
    if (action.action_type === 'whatsapp_reminder' && action.customer_phone) {
      const cleanPhone = action.customer_phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá ${action.customer_name}, notamos um atraso na sua cobrança de R$ ${action.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Poderia nos confirmar o pagamento?`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
      return;
    }

    if (action.action_type === 'crm_action' && action.customer_phone) {
      const cleanPhone = action.customer_phone.replace(/\D/g, '');
      const message = encodeURIComponent(`Olá ${action.customer_name}! Como você está? Notamos que faz um tempo que não nos visita. Temos novidades para você!`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
      return;
    }

    if (action.url) {
      router.visit(action.url);
    }
  };

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
      case 'crm_action': return <ArrowRight className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Card className="xl:col-span-12 border shadow-sm bg-card">
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
              className="group flex flex-col p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <Badge className={getPriorityColor(action.priority)}>
                  {action.priority === 'high' ? 'Crítico' : action.priority === 'medium' ? 'Importante' : 'Sugestão'}
                </Badge>
                <span className="text-xs font-medium text-slate-500">Iniciado: {action.due_date}</span>
              </div>
              
              <div className="mb-4">
                <h4 className="font-bold text-foreground mb-1">{action.customer_name}</h4>
                <p className="text-sm text-muted-foreground leading-tight">
                  {action.suggestion}
                </p>
                {action.amount > 0 && (
                  <div className="mt-2 text-lg font-black text-indigo-600 dark:text-indigo-400">
                    R$ {action.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleAction(action)}
                disabled={(action.action_type === 'whatsapp_reminder' || action.action_type === 'crm_action') && !action.customer_phone}
                className="mt-auto w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getIcon(action.action_type)}
                {action.action_label}
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
              {((action.action_type === 'whatsapp_reminder' || action.action_type === 'crm_action') && !action.customer_phone) && (
                <p className="text-[10px] text-red-500 mt-1 text-center font-medium">Telefone não cadastrado</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
