import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CreditCard, MessageSquare, ArrowRight, Zap } from 'lucide-react';
import { router } from '@inertiajs/react';
import { SectionCard } from '@/components/Shared/SectionCard';

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
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-info/10 text-info border-info/20';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_link': return <CreditCard className="w-4 h-4" />;
      case 'whatsapp_reminder': return <MessageSquare className="w-4 h-4" />;
      case 'crm_action': return <Zap className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <SectionCard
      title="Próximas Melhores Ações"
      subtitle="Ações recomendadas para aumentar a receita e retenção hoje."
      headerAction={
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
          <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-wide">
            {actions.length} recomendações
          </span>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <div 
            key={`${action.action_type}-${action.id}`}
            className="group flex flex-col p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Header: Priority + Date */}
            <div className="flex justify-between items-center mb-4">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getPriorityColor(action.priority)}`}>
                {action.priority === 'high' ? 'Crítico' : action.priority === 'medium' ? 'Importante' : 'Sugestão'}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/40">Vence {action.due_date}</span>
            </div>
            
            {/* Content */}
            <div className="mb-6 flex-1">
              <h4 className="font-bold text-base text-foreground mb-1 tracking-tight truncate">{action.customer_name}</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-70 line-clamp-2">
                {action.suggestion}
              </p>
              {action.amount > 0 && (
                <div className="mt-3 text-xl font-black text-primary tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(action.amount)}
                </div>
              )}
            </div>
            
            {/* Action Button */}
            <Button 
              variant="default" 
              size="lg" 
              onClick={() => handleAction(action)}
              disabled={(action.action_type === 'whatsapp_reminder' || action.action_type === 'crm_action') && !action.customer_phone}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 h-12 transition-all active:scale-[0.98] disabled:opacity-30"
            >
              <div className="flex items-center gap-2">
                {getIcon(action.action_type)}
                {action.action_label}
              </div>
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {((action.action_type === 'whatsapp_reminder' || action.action_type === 'crm_action') && !action.customer_phone) && (
              <p className="text-[10px] text-destructive mt-2 text-center font-medium opacity-70">⚠️ Telefone não cadastrado</p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
